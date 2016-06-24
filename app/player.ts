import { Unit } from './unit';
import { uuid } from './uuid';

export class Player extends Phaser.Sprite {
  private static maxVelocity = 1000;
  private static acceleration = Player.maxVelocity * 0.2;
  private static crouchVelocity = 50;
  private static crouchAcceleration = 1;

  private static gravity = 5000;
  private static jumpSpeed = 1800;
  private static doubleJumpSpeed = 1500;
  private static doubleJumpMargin = 0.5;

  private static saveCooldown = 100;

  savePosition = _.throttle(() => {
    firebase.database()
      .ref(`players/${this.id}`)
      .update({
        position: {
          x: this.x,
          y: this.game.height - this.y
        },
        uuid: this.uuid
      });
  }, Player.saveCooldown);
  uuid: string;

  isPressingJump: boolean;
  private doubleJumpingAllowed: boolean;

  private maxVelocity: number;
  private acceleration: number;

  constructor(game: Phaser.Game, x: number, y: number, public id: string) {
    super(game, x, y, 'player');

    this.anchor.set(0.5);
    // Make the player slightly smaller than 1 unit to allow squeezing into tight spaces
    this.scale.set(Unit.value * 0.999);

    this.game.add.existing(this);
    this.game.physics.arcade.enable(this);
    this.body.gravity.y = Player.gravity;

    this.uuid = uuid();
  }

  // Set bounds as the player moves
  // http://codepen.io/jackrugile/pen/fqHtn
  centerCamera() {
    this.game.world.setBounds(
      this.x - this.game.width * 0.5, 0,
      this.x + this.game.width * 0.5, this.game.height
    );
  }

  crouch() {
    this.maxVelocity = Player.crouchVelocity;
    this.acceleration = Player.crouchAcceleration;
  }

  stand() {
    this.maxVelocity = Player.maxVelocity;
    this.acceleration = Player.acceleration;
  }

  moveLeft() {
    if (-this.maxVelocity < this.body.velocity.x) {
      this.body.velocity.x -= this.acceleration;
    }
  }

  moveRight() {
    if (this.body.velocity.x < this.maxVelocity) {
      this.body.velocity.x += this.acceleration;
    }
  }

  stop() {
    // TODO: Fix stopping after standing while moving
    if (this.body.velocity.x < 0) {
      this.body.velocity.x += this.acceleration;
    }
    else if (0 < this.body.velocity.x) {
      this.body.velocity.x -= this.acceleration;
    }
  }

  canJump(): boolean {
    return this.body.touching.down;
  }

  jump() {
    // TODO: Reduce X scale while in the air
    this.body.velocity.y = -Player.jumpSpeed;
    this.doubleJumpingAllowed = true;
  }

  canDoubleJump(): boolean {
    return (
      this.doubleJumpingAllowed && !this.isPressingJump &&
      -Player.jumpSpeed * Player.doubleJumpMargin < this.body.velocity.y &&
      this.body.velocity.y < Player.jumpSpeed * Player.doubleJumpMargin
    );
  }

  doubleJump() {
    if (this.body.velocity.y < 0) {
      this.body.velocity.y = -Player.doubleJumpSpeed;
    }
    else {
      this.body.velocity.y -= Player.doubleJumpSpeed;
    }
    this.doubleJumpingAllowed = false;
  }

  watchPosition(callback?: Function) {
    firebase.database()
      .ref(`players/${this.id}/position`)
      .on('child_changed', (positionChildSnapshot: FirebaseSnapshot) => {
        const position = { x: this.x, y: this.y };
        switch (positionChildSnapshot.key) {
          case 'x':
            position.x = positionChildSnapshot.val();
            break;
          case 'y':
            position.y = this.game.height - positionChildSnapshot.val();
            break;
        }

        this.game.add.tween(this.position).to(position, 100, Phaser.Easing.Linear.None, true);

        if (callback) {
          callback();
        }
      });
  }
}
