import { Card, DrawnCard, DeckSystem } from '../types';
import { INITIAL_DECK } from '../constants';

/**
 * Time-Entropy Randomizer
 * Combines crypto API with high-resolution time and user input entropy simulation
 */
const getTrueRandom = (): number => {
  const cryptoArray = new Uint32Array(1);
  crypto.getRandomValues(cryptoArray);
  const cryptoVal = cryptoArray[0] / (0xffffffff + 1);
  
  const timeEntropy = (performance.now() % 1000) / 1000;
  
  // Mix them (simple XOR logic simulated for float)
  let random = (cryptoVal + timeEntropy);
  if (random > 1) random -= 1;
  
  return random;
};

/**
 * Draw cards preventing duplicates and handling orientation weights
 */
export const drawCards = (
  count: number, 
  system: DeckSystem
): DrawnCard[] => {
  // Deep copy deck to avoid mutations
  // In a full implementation, Thoth vs Waite would load different base JSONs.
  // Here we simulate the variation primarily in Interpretation, using standard schema.
  const deckPool = [...INITIAL_DECK];
  const drawn: DrawnCard[] = [];
  const drawnIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    if (deckPool.length === 0) break;

    // Chaos selection
    let index = Math.floor(getTrueRandom() * deckPool.length);
    const card = deckPool[index];

    // Remove from pool to prevent duplicates
    deckPool.splice(index, 1);
    drawnIds.add(card.id);

    // Orientation Logic: 60% Upright, 40% Reversed
    const isUpright = getTrueRandom() > 0.4;

    drawn.push({
      ...card,
      isUpright,
      positionIndex: i
    });
  }

  return drawn;
};