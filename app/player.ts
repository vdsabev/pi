import { Move } from './move';
import { Unit } from './unit';

export class Player extends Phaser.Sprite {
  private static gravity = 5000;
  private static savePositionCooldown = 100;

  savePosition = _.throttle(() => {
    firebase.database().ref(`players/${this.id}/position`).set({
      t: Date.now(),
      x: Math.round(this.x * Unit.inverseValue),
      y: Math.round((this.game.height - this.y) * Unit.inverseValue)
    });
  }, Player.savePositionCooldown);

  constructor(game: Phaser.Game, x: number, y: number, public id: string) {
    super(game, x * Unit.value, y * Unit.value, 'player');

    this.anchor.set(0.5);
    this.scale.set(Unit.value / this.width, Unit.value / this.height);

    this.game.add.existing(this);
    this.game.physics.arcade.enable(this);
    this.body.gravity.y = Player.gravity;
    this.body.bounce.set(0.75, 0.5);
    this.body.drag.x = 800;
  }

  // Set bounds as the player moves
  // http://codepen.io/jackrugile/pen/fqHtn
  follow() {
    this.game.world.setBounds(
      this.x - this.game.width * 0.5, 0,
      this.x + this.game.width * 0.5, this.game.height
    );
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
    // TODO: Add max speed
    return 100 * Math.sqrt(fromPoint.distance(toPoint)); // MAGIC
  }

  // Remote actions
  saveMove(move: Move) {
    firebase.database().ref(`players/${this.id}/move`).set({
      fromX: Math.round(this.x * Unit.inverseValue),
      fromY: Math.round((this.game.height - this.y) * Unit.inverseValue),
      speed: move.speed,
      t: Date.now(),
      toX: Math.round(move.x * Unit.inverseValue),
      toY: Math.round((this.game.height - move.y) * Unit.inverseValue)
    });
  }

  watchMoves() {
    firebase.database()
      .ref(`players/${this.id}/move`)
      .on('value', (moveSnapshot: any) => {
        const moveVal = moveSnapshot.val();
        if (moveVal) {
          this.position.set(moveVal.fromX * Unit.value, this.game.height - moveVal.fromY * Unit.value);
          this.move(new Move(moveVal.toX * Unit.value, this.game.height - moveVal.toY * Unit.value, moveVal.speed));
        }
      });
  }
}
