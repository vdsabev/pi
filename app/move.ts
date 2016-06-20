export class Move extends Phaser.Point {
  constructor(x: number, y: number, public speed: number) {
    super(x, y);
  }
}
