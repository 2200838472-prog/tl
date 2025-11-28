import { ReadingRequest, FullReadingResponse, CardInterpretation, InterpretationMode } from '../types';

// Robust key retrieval: Try process.env, then Vite import.meta, then fallback to the provided key
// Note: On a public client-side deployment, this key might be visible if not using the proxy.
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || 'sk-3c0c5f5063fa47d6a07f73692db9482e';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// --- Types for Test Module ---
export interface TestQuestion {
    question: string;
    level: number;
}

export interface TestEvaluation {
    passed: boolean;
    score: number;
    feedback: string;
}

// Helper to extract JSON from text
function extractJSON(text: string): any {
    try {
        return JSON.parse(text);
    } catch (e) {
        // Common issue: Markdown code blocks
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(clean);
        } catch (e2) {
            // Find first { and last }
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                const jsonStr = text.substring(start, end + 1);
                try {
                    return JSON.parse(jsonStr);
                } catch (e3) {
                     throw new Error("DeepSeek response did not contain valid JSON.");
                }
            }
            throw new Error("No valid JSON structure found in response");
        }
    }
}

// Helper to clean text according to user specification
function cleanText(text: string): string {
    if (!text) return "";
    let cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s。\.,，]/g, ' ');
    return cleaned.trim();
}

// Helper for calling DeepSeek API via Backend Proxy (Preferred) or Direct (Fallback)
// Added 'temperature' parameter to control creativity vs strictness
async function callDeepSeek(messages: any[], maxTokens = 3000, jsonMode = false, temperature = 0.7) {
    
    // CRITICAL FIX: DeepSeek requires "json" in the system prompt if response_format is json_object
    if (jsonMode) {
        const hasSystemJson = messages.some((m: any) => m.role === 'system' && (m.content.toLowerCase().includes('json')));
        if (!hasSystemJson) {
            // Inject system prompt at the beginning
            messages.unshift({
                role: 'system',
                content: 'You are a helpful assistant. You must output your response in valid JSON format.'
            });
        }
    }

    // 1. Try Backend Proxy first (Best for CORS & Security)
    try {
        // Relative path works best for Vercel rewrites
        const proxyResponse = await fetch('/api/deepseek/interpret', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages,
                maxTokens,
                jsonMode,
                temperature
            })
        });

        // If proxy exists and works
        if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            return data.content;
        } else {
             // If 404, it means we are likely on a static host without the node backend.
             // We proceed to try direct call.
             if (proxyResponse.status !== 404) {
                 console.warn("Proxy Error, falling back to direct:", proxyResponse.status);
             }
        }
    } catch (e) {
        // Network error to proxy? Fallback.
        console.warn("Proxy unreachable, trying direct connection...");
    }

    // 2. Fallback: Direct API Call (Might fail due to CORS on some browsers)
    if (!DEEPSEEK_API_KEY) {
        throw new Error("Missing DeepSeek API Key");
    }

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens,
            stream: false,
            response_format: jsonMode ? { type: 'json_object' } : undefined
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API请求失败: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// --- Divination Functions ---

export const generateInterpretation = async (request: ReadingRequest): Promise<FullReadingResponse> => {
  const prompt = buildInterpretationPrompt(request);

  try {
    const aiResponse = await callDeepSeek([
          {
            role: 'system',
            content: `你是一位精通DeepSeek推理模型的世界级塔罗大师，擅长融合韦特、透特体系与现代心理学。
你的解读风格：专业、冷静、共情、中立。
你拒绝模棱两可的废话，专注于从牌面符号、元素互动和数字脉络中挖掘深层逻辑。
你将严格按照用户的指令结构进行输出，确保JSON格式合法。
【重要格式要求】输出的文本中，除空格、句号（。）、逗号（，）外，严禁出现其他任何标点符号（如引号、括号、冒号、分号、破折号等）。`
          },
          {
            role: 'user',
            content: prompt
          }
    ], 3000, true, 0.7); // Standard creative temperature
    
    return parseAIResponse(aiResponse, request);
    
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw error;
  }
};

export const generateVisionImage = async (cardNames: string[], question: string): Promise<string | null> => {
  return null;
};

// 构建提示词
const buildInterpretationPrompt = (request: ReadingRequest): string => {
  const { question, deck, mode, cards } = request;
  
  const modeDescription = mode === InterpretationMode.SANCIA 
    ? '天地人三才体系（分析天位/宿命、地位/现实、人位/策略之间的能量生克与流通）'
    : '卡巴拉生命之树体系（分析从Kether到Malkuth的能量沉降路径，寻找阻塞点）';

  const cardsDescription = cards.map((card, index) => 
    `第${index + 1}张: ${card.name} (${card.nameZh}) - ${card.isUpright ? '正位' : '逆位'} - ${card.arcana}${card.suit ? ` - ${card.suit}` : ''}`
  ).join('\n');

  return `
用户问题：${question}
使用牌系：${deck}
解读模式：${modeDescription}
抽牌结果（线性抽取6张）：
${cardsDescription}

请扮演一位世界级塔罗大师，严格按照以下【四个步骤】进行深度解读，并返回纯 JSON 格式：

**第一步：快速判断问题类型（融入解读基调）**
- 心态/关系类：侧重人物心态、互动模式。
- 发展/决策类：侧重局势动能、行动路径。
- 反思/成长类：侧重内在冲突、信念重组。

**第二步：整体扫描与核心信息 (对应 summary 字段)**
- 观察整体画面：主色调、元素分布（火水风土）、大牌数量、数字脉络。
- **输出要求**：仅用 1-2 句话，一针见血地概括牌阵揭示的核心信息、能量状态或主要挑战。

**第三步：结构化逐层解析 (对应 synthesis 字段的主体)**
请将6张牌纳入严密的叙事逻辑中，采用以下三层结构（请在叙述时不要使用标题符号，直接分段陈述）：
1. **现状与情境（重点分析前两张牌）**
   - 分析前两张牌如何共同描绘了当前状况的缩影。
   - 关注牌之间的数字序列、元素互动或叙事逻辑（例如：表面满足背后的僵局）。
2. **核心驱动与深层结构（重点分析中间两张牌）**
   - 将最明显的信息视为核心驱动力，另一张视为互动力量（挑战或资源）。
   - 如果是人物牌：分析角色姿态和能量差异；如果是场景牌：分析内在动机与外部环境。
   - 指出张力、和谐或转化点。
3. **综合叙事与赋能建议 (对应 synthesis 字段的结尾)**
   - 将三层解析串联成一个连贯、有因果逻辑的故事。
   - **必须包含清晰、务实的建议**：
     - **行动策略**：具体可以做什么？
     - **心态调整**：应如何思考？
     - **需警惕的陷阱**：应避免什么？

**第四步：单牌微观视角 (对应 cardInterpretations 字段)**
- 为每一张牌提供具体的微观分析。

**输出规范与风格**
- 风格：专业、冷静、共情、中立。使用“牌面显示……”、“能量倾向于……”、“这可能意味着……”等开放性语言，避免“一定会”、“必然”等绝对化断言。
- **标点限制**：严格遵守！除空格、句号（。）、逗号（，）外，**不要使用任何其他标点符号**。不要用冒号、引号、括号、星号等。如果需要列举，请使用空格或自然分句。
- Token限制：严格控制在3000 Tokens以内。

**JSON 结构模板**：
{
  "summary": "核心洞察（1-2句，最犀利的结论，无特殊标点）",
  "synthesis": "纯文本。包含【结构化逐层解析】的三层逻辑，以及最后的【赋能建议】。内容需详实，逻辑严密，仅使用逗号句号和空格。",
  "cardInterpretations": [
    {
      "cardId": "必须与输入ID一致",
      "coreMeaning": "4-6个字的精准关键词（无标点）",
      "contextAnalysis": "该牌在整体叙事中的微观分析 (约100字，无特殊标点)",
      "actionAdvice": "一句具体的微观建议（无特殊标点）"
    }
  ]
}
`;
};

// 解析AI响应
const parseAIResponse = (response: string, request: ReadingRequest): FullReadingResponse => {
  try {
    const parsed = extractJSON(response);
      
    // 确保每张牌都有正确的cardId，并清洗所有文本字段
    const cardInterpretations: CardInterpretation[] = parsed.cardInterpretations.map((interp: any, index: number) => {
      const card = request.cards[index];
      return {
        cardId: interp.cardId || card?.id || `card_${index}`,
        coreMeaning: cleanText(interp.coreMeaning || `${card?.nameZh}的含义`),
        contextAnalysis: cleanText(interp.contextAnalysis || '分析中'),
        actionAdvice: cleanText(interp.actionAdvice || '建议')
      };
    });

    return {
      summary: cleanText(parsed.summary || '解读完成'),
      synthesis: cleanText(parsed.synthesis || '请参考详细解读'),
      cardInterpretations
    };
    
  } catch (error) {
    console.error('解析AI响应失败:', error);
    throw new Error('AI响应格式错误');
  }
};

// --- Test/Rate Functions (For TarotRateTest.tsx) ---

const TEST_TOPICS = [
  "Major Arcana archetypes", "Suit of Wands", "Suit of Cups", "Suit of Swords", "Suit of Pentacles",
  "Court Cards personalities", "Numerology in Tarot", "Color symbolism", "Astrological associations",
  "Kabbalistic paths", "Elemental dignities", "The Fool's Journey", "Reverse meanings", "Mythological connections"
];

const getRandomTopic = () => TEST_TOPICS[Math.floor(Math.random() * TEST_TOPICS.length)];

export const generateTestQuestion = async (level: number, system: InterpretationMode = InterpretationMode.SANCIA): Promise<TestQuestion> => {
    let difficultyDesc = "";
    let focusArea = getRandomTopic();
    
    switch(level) {
        case 1:
            difficultyDesc = "Level 1 (Novice - 入门): 考察基础知识。牌面主要图像元素、基本关键词、基础四元素属性。问题应简单直接。";
            focusArea = "Basic Imagery & Keywords";
            break;
        case 2:
            difficultyDesc = "Level 2 (Apprentice - 学徒): 考察动态理解。正位与逆位的区别、两张牌的异同、1-10数字学的含义。";
            break;
        case 3:
            difficultyDesc = "Level 3 (Adept - 熟手): 考察实战应用。在特定场景下某张牌的解读，或元素互动逻辑。";
            break;
        case 4:
            // Strengthened for Master Level as requested
            difficultyDesc = "Level 4 (Master - 世界大师水准): 极高难度的神秘学考据。必须严格考察金色黎明（Golden Dawn）体系的底层严密数据。例如：占星度数（Decans）、希伯来字母及数值（Gematria）、生命之树具体路径编号（11-32路径）、天使名号（Shem HaMephorash）、颜色阶梯（King/Queen Scale）。这些是区分“爱好者”和“学院派大师”的硬指标。禁止提问通用含义，必须提问具体对应关系。";
            focusArea = "Golden Dawn Correspondences & Qabalah";
            break;
        case 5:
            difficultyDesc = "Level 5 (Grandmaster - 宗师): 考察哲学综合与体系比较。要求解释塔罗牌设计背后的神学/哲学原理，如透特之书与韦特塔罗在宇宙论上的差异。";
            focusArea = "Philosophy, Theology & System Synthesis";
            break;
        default:
            difficultyDesc = "General Tarot Knowledge";
    }
    
    const prompt = `生成一个独特的塔罗牌测试问题。
    当前难度等级：${level}
    难度定义：${difficultyDesc}
    建议切入点（保证随机性）：${focusArea}
    解读体系偏好：${system}
    语言：中文
    
    指令：
    1. **严格分级**。Level 4 必须是针对'世界级塔罗大师'的硬核考题，涉及具体数据和对应关系。
    2. 题目要随机多变，拒绝陈词滥调。
    3. 这是一个简答题，不要提供选项。
    4. 务必返回合法的 JSON 格式，不要包含 Markdown 标记：
    {"question": "问题内容..."}
    `;

    try {
        // High temperature for randomness (0.9)
        const aiResponse = await callDeepSeek([
            { role: 'user', content: prompt }
        ], 1000, true, 0.9);

        const json = extractJSON(aiResponse);
        
        return {
            question: json.question,
            level
        };

    } catch (e) {
        console.error("Test Gen Error:", e);
        throw e;
    }
};

export const evaluateTestAnswer = async (question: string, userAnswer: string, level: number): Promise<TestEvaluation> => {
    const prompt = `
      请扮演一位极其严格的神秘学主考官（Master Occultist），评估考生的答案。
      
      难度等级：${level}
      问题："${question}"
      考生回答："${userAnswer}"
      
      评分标准（满分100，及格60）：
      Level 4 为零容忍模式。如果考生回答模糊、错误、或者仅凭直觉作答而没有列出准确的神秘学术语（如希伯来字母、具体度数、颜色阶梯），直接判定不及格（分数<60）。
      
      请务必返回合法的 JSON 格式，不要包含 Markdown 标记：
      {"score": 数字, "feedback": "简短的中文评价"}
    `;

    try {
        // Low temperature for strictness and consistency (0.3)
        const aiResponse = await callDeepSeek([
            { role: 'user', content: prompt }
        ], 1000, true, 0.3);
        
        const json = extractJSON(aiResponse);
        
        return {
            score: json.score || 0,
            passed: (json.score || 0) >= 60,
            feedback: json.feedback || "评估完成"
        };
    } catch (e) {
         throw e;
    }
};

export const generateReferenceAnswer = async (question: string, level: number): Promise<string> => {
    const prompt = `请给出这个塔罗问题的标准答案（难度 ${level}）。问题："${question}"。中文，50字以内，精准概括。`;
    try {
        // Balanced temperature (0.5)
        return await callDeepSeek([{ role: 'user', content: prompt }], 500, false, 0.5);
    } catch(e) {
        throw e;
    }
};