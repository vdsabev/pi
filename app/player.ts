export class Player extends Phaser.Sprite {
  constructor(game: Phaser.Game, x: number, y: number) {
    super(game, x, y, 'player');

    this.scale.set(game.height * 0.1 / this.height);
    this.anchor.set(0.5);
  }

  isMoving(): boolean {
    return this.body.velocity.x || this.body.velocity.y;
  }
}
