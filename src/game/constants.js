export const CARD_TYPES = {
  KING: '王',
  rook: '飛',
  bishop: '角',
  gold: '金',
  silver: '銀',
  knight: '馬',
  lance: '香',
  pawn: 'し'
};

export const SCORES = {
  [CARD_TYPES.KING]: 50,
  [CARD_TYPES.rook]: 40,
  [CARD_TYPES.bishop]: 40,
  [CARD_TYPES.gold]: 30,
  [CARD_TYPES.silver]: 30,
  [CARD_TYPES.knight]: 20,
  [CARD_TYPES.lance]: 20,
  [CARD_TYPES.pawn]: 10
};

export const INITIAL_DECK_COUNTS = {
  [CARD_TYPES.KING]: 2,
  [CARD_TYPES.rook]: 2,
  [CARD_TYPES.bishop]: 2,
  [CARD_TYPES.gold]: 4,
  [CARD_TYPES.silver]: 4,
  [CARD_TYPES.knight]: 4,
  [CARD_TYPES.lance]: 4,
  [CARD_TYPES.pawn]: 10
}; // Total 32

export const PLAYERS = [0, 1, 2, 3]; // 0 is usually Human
