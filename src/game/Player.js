import { CARD_TYPES } from './constants.js';

export class Player {
  constructor(id, isHuman = false) {
    this.id = id;
    this.isHuman = isHuman;
    this.hand = [];
    this.team = id % 2; // 0 & 2 are team 0, 1 & 3 are team 1
  }

  setHand(cards) {
    this.hand = cards;
    // Sort hand logic can be added here
  }

  removeCard(card) {
    this.hand = this.hand.filter(c => c.id !== card.id);
  }

  hasCard(type) {
    return this.hand.some(c => c.type === type);
  }

  // Basic NPC Logic
  decideAction(gameState) {
    if (this.isHuman) return null; // Wait for UI input

    // Simulate thinking time
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this._aiLogic(gameState));
      }, 1000); // 1 second think time
    });
  }

  _aiLogic(gameState) {
    // gameState gives info about: currentAttack, history, other players (visible info only ideally)
    const { currentAttack } = gameState;

    if (!currentAttack) {
      // === LEAD ===
      // Pick random pair
      if (this.hand.length >= 2) {
        const idx1 = Math.floor(Math.random() * this.hand.length);
        let idx2 = Math.floor(Math.random() * this.hand.length);
        while (idx1 === idx2) idx2 = Math.floor(Math.random() * this.hand.length);

        return {
          action: 'playTurn',
          card1: this.hand[idx1],
          card2: this.hand[idx2]
        };
      } else {
        // Fallback for edge cases (should not happen in normal flow if logic is sound)
        return { action: 'pass' };
      }
    } else {
      // === COUNTER ===
      const attackType = currentAttack.card.type;

      // Find valid Match cards
      const validMatches = this.hand.filter(c => {
        if (c.type === attackType) return true;
        if (c.type === CARD_TYPES.KING && attackType !== CARD_TYPES.pawn && attackType !== CARD_TYPES.lance) return true;
        return false;
      });

      // Simple AI: Always defend if possible (for now, to ensure game flow)
      if (validMatches.length > 0) {
        const matchCard = validMatches[0];
        const remainingHand = this.hand.filter(c => c.id !== matchCard.id);

        if (remainingHand.length > 0) {
          // Found a pair!
          // Pick random attack card from rest
          const idx2 = Math.floor(Math.random() * remainingHand.length);
          return {
            action: 'playTurn',
            card1: matchCard,
            card2: remainingHand[idx2]
          };
        }
      }

      return { action: 'pass' };
    }
  }
}
