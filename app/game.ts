import { Aim } from './aim';
import { piDigits } from './pi';
import { Player } from './player';

export class Game {
  static gravity = 4000;
  static playerID = window.prompt('Enter your player ID:', '-KKFbucEljzXDLEC-49X');
  static saveCooldown = 100;
  static controls = {
    decreaseAimSize: Phaser.Keyboard.S,
    increaseAimSize: Phaser.Keyboard.W,
    rotateAimLeft: Phaser.Keyboard.A,
    rotateAimRight: Phaser.Keyboard.D,
    shoot: Phaser.Keyboard.SPACEBAR
  };

  game: Phaser.Game;
  initialWidth: number;
  initialHeight: number;
  platforms: Phaser.Group;
  player: Player;
  otherPlayers: Player[] = [];
  aim: Phaser.Sprite;

  savePlayerPosition = _.throttle(() => {
    firebase.database()
      .ref(`players/${Game.playerID}/position`)
      .set({
        x: this.player.x,
        y: this.game.height - this.player.y
      });
  }, Game.saveCooldown);

  preload() {
    this.game.stage.backgroundColor = 0x000000;
    this.game.load.image('platform', 'assets/sprites/platform.png');
    this.game.load.image('player', 'assets/sprites/player.png');
  }

  create() {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.time.advancedTiming = true;
    this.game.world.setBounds(0, 0, this.game.width, this.game.height);

    this.addPlatforms();

    this.player = this.createPlayer(this.game.world.centerX, this.game.world.centerY);
    this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);
    this.aim = new Aim(this.player);

    // this.getOnlinePlayers();
  }

  addPlatforms() {
    this.platforms = this.game.add.group();
    this.platforms.enableBody = true;

    const platformWidth = 200;
    const platformHeight = this.game.height * 0.075;

    // Create left wall
    this.addPlatform(
      0, 0,
      platformHeight, this.game.height
    );

    // Create floor
    this.addPlatform(
      0, this.game.height - platformHeight,
      this.game.width,
      platformHeight
    );

    // Create ceiling
    this.addPlatform(0, 0, 10 * this.game.width, platformHeight);

    // Create digits
    _(100).times((index) => {
      const offsetDigit = piDigits[index] + 1;
      this.addPlatform(
        this.game.width + index * platformWidth, this.game.height - offsetDigit * platformHeight,
        platformWidth, offsetDigit * platformHeight
      );
    });
  }

  addPlatform(x: number, y: number, width: number, height: number) {
    const platform = this.platforms.create(x, y, 'platform');
    platform.scale.set(width, height);
    platform.body.immovable = true;

    return platform;
  }

  createPlayer(x = 0, y = 0): Player {
    const player = new Player(this.game, x, this.game.height - y);

    this.game.add.existing(player);
    this.game.physics.arcade.enable(player);
    player.body.gravity.y = Game.gravity;
    player.body.collideWorldBounds = true;
    player.body.bounce.set(0.8, 0);

    return player;
  }

  getOnlinePlayers() {
    firebase.database().ref('players').on('child_added', (playerSnapshot: any) => {
      const position = playerSnapshot.val().position;
      const player = this.createPlayer(position.x, position.y);
      if (playerSnapshot.key === Game.playerID) {
        this.player = player;
        this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);
      }
      else {
        this.otherPlayers.push(player);
        firebase.database()
          .ref(`players/${playerSnapshot.key}/position`)
          .on('child_changed', (positionSnapshot: any) => {
            (player as any)[positionSnapshot.key] = positionSnapshot.val();
          });
      }
    });
  }

  update() {
    if (this.player) {
      this.game.physics.arcade.collide(this.player, this.platforms);
      this.readInputControls();
    }

    _(this.otherPlayers).forEach((player) => {
      this.game.physics.arcade.collide(player, this.platforms);
    });
  }

  readInputControls() {
    this.readAimRotationControls();
    this.readAimSizeControls();
    this.readShootControls();

    if (this.player.body.deltaX()) {
      this.followPlayer();
      // this.savePlayerPosition();
    }
  }

  readAimSizeControls() {
    if (this.game.input.keyboard.isDown(Game.controls.increaseAimSize)) {
      this.aim.scale.x += 15;
    }
    else if (this.game.input.keyboard.isDown(Game.controls.decreaseAimSize)) {
      this.aim.scale.x -= 15;
    }
  }

  readAimRotationControls() {
    if (this.game.input.keyboard.isDown(Game.controls.rotateAimLeft)) {
      this.aim.rotation -= 0.05;
    }
    else if (this.game.input.keyboard.isDown(Game.controls.rotateAimRight)) {
      this.aim.rotation += 0.05;
    }
  }

  readShootControls() {
    if (this.game.input.keyboard.isDown(Game.controls.shoot) && !this.player.isMoving()) {
      this.player.body.velocity.set(2 * this.aim.width * Math.cos(this.aim.rotation), 2 * this.aim.width * Math.sin(this.aim.rotation));
    }
    else if (this.player.body.touching.down) {
      this.player.body.velocity.x = 0;
    }
  }

  // Set bounds as the player moves
  // http://codepen.io/jackrugile/pen/fqHtn
  followPlayer() {
    this.game.world.setBounds(
      0, 0,
      this.player.x + this.game.width * 0.5, this.game.height
    );
  }

  render() {
    this.game.debug.text(`${this.game.time.fps} FPS`, 32, 32);
    this.game.debug.cameraInfo(this.game.camera, 32, 48);
  }
}
