export enum DeckSystem {
  WAITE = 'Waite',
  THOTH = 'Thoth'
}

export enum InterpretationMode {
  SANCIA = 'SANCIA', // Heaven, Earth, Man
  KABBALAH = 'KABBALAH' // Tree of Life
}

export interface Card {
  id: string;
  name: string; // e.g., "The Fool"
  nameZh: string; // e.g., "愚人"
  arcana: 'Major' | 'Minor';
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Pentacles' | 'Disks';
  number?: number;
  keywords: string[];
}

export interface DrawnCard extends Card {
  isUpright: boolean;
  positionIndex: number; // 0-5
}

export interface ReadingRequest {
  question: string;
  deck: DeckSystem;
  mode: InterpretationMode;
  cards: DrawnCard[];
}

export interface CardInterpretation {
  cardId: string;
  coreMeaning: string;
  contextAnalysis: string;
  actionAdvice: string;
}

export interface FullReadingResponse {
  summary: string;
  cardInterpretations: CardInterpretation[];
  synthesis: string; // Overall synthesis based on Mode (Heaven/Earth or Kabbalah)
}

export interface LearningTopic {
  id: string;
  title: string;
  subtitle: string;
  content: string; // Markdown-like or simple text
  diagram?: string; // Type of diagram to render
}

export interface AcknowledgmentProfile {
  name: string;
  role: string;
  avatarSeed: string; // For generating consistent Q-avatars
}