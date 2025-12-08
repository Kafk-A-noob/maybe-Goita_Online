export class Card {
  constructor(type, id) {
    this.type = type;
    this.id = id; // unique id to track specific cards
    this.faceUp = false;
    this.isJewel = false;
  }

  flip() {
    this.faceUp = !this.faceUp;
  }
}
