import { piDigits } from './pi';

export class Game {
  static playerMoveSpeed = 1000;
  static playerJumpSpeed = 2000;
  static gravity = 4000;

  static playerID = window.prompt('Enter your player ID:', '-KKFbucEljzXDLEC-49X');
  static saveCooldown = 100;

  game: Phaser.Game;
  initialWidth: number;
  initialHeight: number;
  player: Phaser.Sprite;
  otherPlayers: Phaser.Sprite[] = [];
  platforms: Phaser.Group;

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
    this.game.world.setBounds(0, 0, this.game.width, this.game.height);
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.addPlatforms();

    // TODO: Create player when registering
    // this.player = this.addPlayer();
    // firebase.database().ref('players').push({
    //   x: this.player.x,
    //   y: this.player.y
    // });

    this.player = this.addPlayer(this.game.world.centerX, this.game.world.centerY);
    this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);

    // firebase.database().ref('players').on('child_added', (playerSnapshot: any) => {
    //   const position = playerSnapshot.val().position;
    //   const player = this.addPlayer(position.x, position.y);
    //   if (playerSnapshot.key === Game.playerID) {
    //     this.player = player;
    //     this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);
    //   }
    //   else {
    //     this.otherPlayers.push(player);
    //     firebase.database()
    //       .ref(`players/${playerSnapshot.key}/position`)
    //       .on('child_changed', (positionSnapshot: any) => {
    //         (player as any)[positionSnapshot.key] = positionSnapshot.val();
    //       });
    //   }
    // });
  }

  addPlatforms() {
    this.platforms = this.game.add.group();
    this.platforms.enableBody = true;
    this.platforms.createMultiple(100, 'platform');

    const platformWidth = this.game.width * 0.1;
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
    const platform = this.platforms.getFirstDead();
    if (!platform) return;

    platform.reset(x, y);
    platform.scale.x = width;
    platform.scale.y = height;
    platform.body.immovable = true;

    return platform;
  }

  addPlayer(x = 0, y = 0) {
    const player = this.game.add.sprite(x, this.game.height - y, 'player');
    player.scale.set(this.game.height * 0.1 / player.height);
    player.anchor.set(0.5);

    this.game.physics.arcade.enable(player);
    player.body.gravity.y = Game.gravity;
    player.body.collideWorldBounds = true;

    return player;
  }

  update() {
    if (this.player) {
      this.game.physics.arcade.collide(this.player, this.platforms);
      this.readInputCommands();
    }

    _(this.otherPlayers).forEach((player) => {
      this.game.physics.arcade.collide(player, this.platforms);
    });
  }

  readInputCommands() {
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.player.body.velocity.x = -Game.playerMoveSpeed;
    }
    else if (this.game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.player.body.velocity.x = Game.playerMoveSpeed;
    }
    else {
      this.player.body.velocity.x = 0;
    }

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && this.player.body.touching.down) {
      this.player.body.velocity.y = -Game.playerJumpSpeed;
    }

    // Set bounds as the player moves
    // http://codepen.io/jackrugile/pen/fqHtn
    const playerIsMoving = (
      this.player.body.velocity.x &&
      !(this.player.body.touching.left || this.player.body.touching.right)
    );
    if (playerIsMoving) {
      this.game.world.setBounds(
        0, 0,
        this.player.x + this.game.width * 0.5, this.game.height
      );
      this.savePlayerPosition();
    }
  }

  render() {
    this.game.debug.cameraInfo(this.game.camera, 32, 32);
  }
}
