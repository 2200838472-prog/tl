import { ReadingRequest, FullReadingResponse, CardInterpretation, InterpretationMode } from '../types';

// Robust key retrieval: Try process.env, then Vite import.meta, then fallback to the provided key
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
        // First try direct parse
        return JSON.parse(text);
    } catch (e) {
        // Try cleaning markdown
        const clean = text.replace(/```json|```/g, '').trim();
        try {
            return JSON.parse(clean);
        } catch (e2) {
            // Try finding first { and last }
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw new Error("No valid JSON found in response");
        }
    }
}

// Helper for calling DeepSeek API
async function callDeepSeek(messages: any[], maxTokens = 2000, jsonMode = false) {
    if (!DEEPSEEK_API_KEY) {
        console.warn("DeepSeek API Key is missing.");
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
            temperature: 0.7, // Lower temperature for more focused/analytical output
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
  // 构建DeepSeek请求的提示词
  const prompt = buildInterpretationPrompt(request);

  try {
    const aiResponse = await callDeepSeek([
          {
            role: 'system',
            content: `你是一位世界级的塔罗大师，精通韦特、透特、卡巴拉及中国哲学（易经/三才）。
            
你的解读风格：
1. **快狠准**：不讲废话，不堆砌辞藻，直击问题核心。
2. **逻辑严密**：基于元素论、数字学和符号学进行推理，而非单纯的灵感漫谈。
3. **深度**：拒绝表面化的"看图说话"，深入到能量流动和因果关系的层面。
4. **客观**：客观陈述利弊，不进行无谓的安慰（Chicken Soup），也不故意恐吓。`
          },
          {
            role: 'user',
            content: prompt
          }
    ], 4000, true); // Increased tokens for longer response
    
    // 解析AI响应
    return parseAIResponse(aiResponse, request);
    
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw error; // Strictly throw error, no fallback
  }
};

export const generateVisionImage = async (cardNames: string[], question: string): Promise<string | null> => {
  // Feature removed as requested
  return null;
};

// 构建提示词
const buildInterpretationPrompt = (request: ReadingRequest): string => {
  const { question, deck, mode, cards } = request;
  
  const modeDescription = mode === InterpretationMode.SANCIA 
    ? '天地人三才体系（分析天位/宿命、地位/现实、人位/策略之间的能量生克与流通）'
    : '卡巴拉生命之树体系（分析从Kether到Malkuth的能量沉降路径，寻找阻塞点）';

  const cardsDescription = cards.map((card, index) => 
    `位置${index + 1}: ${card.name} (${card.nameZh}) - ${card.isUpright ? '正位' : '逆位'} - ${card.arcana}${card.suit ? ` - ${card.suit}` : ''}`
  ).join('\n');

  return `
用户问题：${question}
使用牌系：${deck}
解读模式：${modeDescription}

抽到的六张牌：
${cardsDescription}

请严格按照以下JSON格式返回解读结果，不要包含其他任何文字：

{
  "summary": "总体摘要（30-50字，用最犀利的语言概括结论，例如：'看似机会在前，实则根基不稳，盲目行动必致溃败。'）",
  "synthesis": "综合解读（400-600字。这是核心部分。请深入分析牌阵的整体能量场。必须结合元素互动（如火生土、水火不容）和数字逻辑。直接回答用户问题，明确指出事情的成败、走向或核心矛盾所在。严禁使用'可能'、'也许'等模糊词汇。）", 
  "cardInterpretations": [
    {
      "cardId": "牌的唯一ID (必须与输入一致)",
      "coreMeaning": "核心含义（4-6个字以内的精准关键词，作为标题，例如：'意志的崩塌'、'情感的满溢'）",
      "contextAnalysis": "具体分析（100-150字/张。结合问题背景，解释'为什么'这张牌出现在这里意味着什么。分析牌面细节符号与问题的关联。）",
      "actionAdvice": "行动建议（一句话，具体、可执行的操作性建议。）"
    }
  ]
}

极端重要要求（违反将判定为失败）：
1. **紧扣问题**：如果用户问感情，全篇必须围绕感情分析，不要扯事业或自我成长。
2. **拒绝废话**：全篇禁止使用"这张牌代表..."、"在塔罗牌中..."等教科书式凑字数的开场白。直接说："圣杯三逆位揭示了..."。
3. **内容密度**：保证输出内容高密度、高价值。总字数控制在800-1000字左右，确保阅读体验既有深度又不冗长。
4. **体系融合**：
   ${mode === InterpretationMode.SANCIA 
     ? '- 必须明确指出天位（大牌/不可控力）对人位（小牌/行动）的压制或支持。' 
     : '- 必须结合卡巴拉路径的含义，分析意识流动的阻塞点。'}
5. **绝对诚实**：如果牌面不好，直接指出危机，不要粉饰太平。
`;
};

// 解析AI响应
const parseAIResponse = (response: string, request: ReadingRequest): FullReadingResponse => {
  try {
    const parsed = extractJSON(response);
      
    // 确保每张牌都有正确的cardId
    const cardInterpretations: CardInterpretation[] = parsed.cardInterpretations.map((interp: any, index: number) => {
      const card = request.cards[index];
      return {
        cardId: interp.cardId || card?.id || `card_${index}`,
        coreMeaning: interp.coreMeaning || `${card?.nameZh}的含义`,
        contextAnalysis: interp.contextAnalysis || '分析中...',
        actionAdvice: interp.actionAdvice || '建议...'
      };
    });

    return {
      summary: parsed.summary || '解读完成',
      synthesis: parsed.synthesis || '请参考详细解读',
      cardInterpretations
    };
    
  } catch (error) {
    console.error('解析AI响应失败:', error);
    throw new Error('AI响应格式错误');
  }
};

// --- Test/Rate Functions (For TarotRateTest.tsx) ---

// Random topics to ensure variety and prevent caching/repetition
const TEST_TOPICS = [
  "Major Arcana archetypes", "Suit of Wands", "Suit of Cups", "Suit of Swords", "Suit of Pentacles",
  "Court Cards personalities", "Numerology in Tarot", "Color symbolism", "Astrological associations",
  "Kabbalistic paths", "Elemental dignities", "The Fool's Journey", "Reverse meanings", "Mythological connections"
];

const getRandomTopic = () => TEST_TOPICS[Math.floor(Math.random() * TEST_TOPICS.length)];

export const generateTestQuestion = async (level: number, system: InterpretationMode = InterpretationMode.SANCIA): Promise<TestQuestion> => {
    let difficultyDesc = "";
    let focusArea = getRandomTopic();
    
    // Define strict difficulty progression
    switch(level) {
        case 1:
            difficultyDesc = "Level 1 (Novice): 基础知识。考察牌面主要元素、基本关键词、四元素属性。（例如：权杖代表什么元素？愚人的数字是多少？）";
            focusArea = "Basic Keywords & Elements";
            break;
        case 2:
            difficultyDesc = "Level 2 (Apprentice): 进阶理解。考察正逆位的区别、两张牌的异同比较、简单的数字学含义。（例如：女祭司和皇后的母性特质有何不同？）";
            break;
        case 3:
            difficultyDesc = "Level 3 (Adept): 实战应用。考察在特定场景（爱情/事业）中的具体解读，或三张牌的流变逻辑。";
            break;
        case 4:
            difficultyDesc = "Level 4 (Master - 世界大师水准): 极高难度。考察神秘学对应关系。必须涉及：占星度数（Decans）、希伯来字母（Hebrew Alphabet）、生命之树路径（Paths 11-32）、金色黎明颜色阶梯（Color Scales）或透特塔罗的炼金符号。问题必须非常具体且生僻。";
            focusArea = "Esoteric Correspondence (Qabalah/Astrology)";
            break;
        case 5:
            difficultyDesc = "Level 5 (Grandmaster): 宗师境界。考察哲学综合与系统构建。涉及塔罗牌结构的底层逻辑、荣格心理学与炼金术的深度结合、跨体系比较（如透特与马赛的区别及其哲学根源）。";
            focusArea = "Philosophy & System Synthesis";
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
    1. 严格遵守难度定义。Level 4必须达到世界级大师的考核标准，问一些只有钻研过神秘学典籍（如《777之书》或《透特之书》）的人才知道的细节。
    2. 题目要随机多变，不要重复常见问题。
    3. 这是一个简答题，不要提供选项。
    4. 请直接返回JSON。
    
    格式：{"question": "问题内容..."}`;

    try {
        const aiResponse = await callDeepSeek([
            { role: 'user', content: prompt }
        ], 1000, true);

        const json = extractJSON(aiResponse);
        
        return {
            question: json.question,
            level
        };

    } catch (e) {
        console.error("Test Gen Error:", e);
        throw e; // Strictly throw error, no fallback
    }
};

export const evaluateTestAnswer = async (question: string, userAnswer: string, level: number): Promise<TestEvaluation> => {
    const prompt = `
      请扮演一位极其严格的塔罗主考官，评估这个答案。
      
      难度等级：${level}
      问题："${question}"
      考生回答："${userAnswer}"
      
      评分标准（满分100，及格60）：
      1. Level 1-3：主要看核心含义理解是否正确，逻辑是否通顺。
      2. Level 4 (世界大师级)：评分必须极其严苛。
         - 如果考察的是具体的神秘学对应（如某个希伯来字母、某个占星度数），答案必须完全精准。错一个字就是0分。
         - 拒绝模棱两可的“直觉性”回答。如果没有答出技术细节，直接不及格。
      3. Level 5：考察深度。需要看到对塔罗系统底层逻辑的洞见。
      
      请返回纯JSON格式：
      {"score": 数字, "feedback": "简短的中文评价，犀利地点评考生的水平"}
    `;

    try {
        const aiResponse = await callDeepSeek([
            { role: 'user', content: prompt }
        ], 1000, true);
        
        const json = extractJSON(aiResponse);
        
        return {
            score: json.score || 0,
            passed: (json.score || 0) >= 60,
            feedback: json.feedback || "评估完成"
        };
    } catch (e) {
         throw e; // Strictly throw error
    }
};

export const generateReferenceAnswer = async (question: string, level: number): Promise<string> => {
    const prompt = `请给出这个塔罗问题的标准答案（难度 ${level}）。问题："${question}"。中文，50字以内，精准概括。`;
    try {
        const text = await callDeepSeek([
            { role: 'user', content: prompt }
        ], 500, false);
        return text.trim();
    } catch(e) {
        throw e; // Strictly throw error
    }
};