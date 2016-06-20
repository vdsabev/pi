import { Move } from './move';

export class Player extends Phaser.Sprite {
  private static gravity = 5000;

  constructor(game: Phaser.Game, x: number, y: number, public id: string) {
    super(game, x, y, 'player');

    this.scale.set(game.height * 0.1 / this.height);
    this.anchor.set(0.5);

    this.game.add.existing(this);
    this.game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.gravity.y = Player.gravity;
    this.body.bounce.set(0.75, 0.5);
    this.body.drag.x = 800;
  }

  isMoving(): boolean {
    return this.body.velocity.x || this.body.velocity.y;
  }

  move(move: Move = this.getMove()): Move {
    this.game.physics.arcade.moveToXY(this, move.x, move.y, move.speed);
    return move;
  }

  getMove(): Move {
    const x = this.game.input.worldX;
    const y = this.game.input.worldY;
    const speed = this.getMoveSpeed(this.position, new Phaser.Point(x, y));

    return new Move(x, y, speed);
  }

  getMoveSpeed(fromPoint: Phaser.Point, toPoint: Phaser.Point): number {
    return 100 * Math.sqrt(fromPoint.distance(toPoint)); // MAGIC
  }

  // Remote actions
  saveMove(move: Move) {
    firebase.database().ref(`players/${this.id}/move`).set({
      fromX: this.x,
      fromY: this.game.height - this.y,
      speed: move.speed,
      toX: move.x,
      toY: this.game.height - move.y
    });
  }

  watchMoves() {
    firebase.database()
      .ref(`players/${this.id}/move`)
      .on('value', (moveSnapshot: any) => {
        const moveVal = moveSnapshot.val();
        if (moveVal) {
          this.position.set(moveVal.fromX, this.game.height - moveVal.fromY);
          this.move(new Move(moveVal.toX, this.game.height - moveVal.toY, moveVal.speed));
        }
      });
  }
}
