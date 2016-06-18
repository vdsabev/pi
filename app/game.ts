import { piDigits } from './pi';

export class Game {
  static playerSpeed = 10;
  static playerJumpHeight = 100;
  static gravity = 1000;

  static playerID = window.prompt('Enter your player ID:', '-KKFbucEljzXDLEC-49X');
  static saveCooldown = 100;

  game: Phaser.Game;
  cursors: Phaser.CursorKeys;
  player: Phaser.Sprite;
  otherPlayers: Phaser.Sprite[] = [];
  platforms: Phaser.Group;

  savePlayerPosition = _.throttle(() => {
    firebase.database()
      .ref(`players/${Game.playerID}/position`)
      .set({
        x: this.player.x,
        y: this.game.world.height - this.player.y
      });
  }, Game.saveCooldown);

  preload() {
    this.game.stage.backgroundColor = 0x000000;
    this.game.load.image('platform', 'assets/sprites/platform.png');
    this.game.load.image('player', 'assets/sprites/player.png');
  }

  create() {
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.game.world.setBounds(0, 0, this.game.width, this.game.height);
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.addPlatforms();

    // TODO: Create player when registering
    // this.player = this.addPlayer();
    // firebase.database().ref('players').push({
    //   x: this.player.x,
    //   y: this.player.y
    // });

    // const player = this.addPlayer({ x: 0, y: 0 });
    // this.player = player;
    // this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);

    firebase.database().ref('players').on('child_added', (playerSnapshot: any) => {
      const player = this.addPlayer(playerSnapshot.val().position);
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

  addPlatforms() {
    this.platforms = this.game.add.group();
    this.platforms.enableBody = true;
    this.platforms.createMultiple(100, 'platform');

    const platformWidth = this.game.world.width * 0.1;
    const platformHeight = this.game.world.height * 0.075;

    // Create left wall
    this.addPlatform(
      0, 0,
      platformHeight, this.game.world.height
    );

    // Create floor
    this.addPlatform(
      0, this.game.world.height - platformHeight,
      this.game.world.width, platformHeight
    );

    // Create ceiling
    this.addPlatform(
      0, 0,
      100 * this.game.world.width, platformHeight
    );

    // Create digits
    _(100).times((index) => {
      const offsetDigit = piDigits[index] + 1;
      this.addPlatform(
        this.game.world.width + index * platformWidth, this.game.world.height - offsetDigit * platformHeight,
        platformWidth, offsetDigit * platformHeight
      );
    });
  }

  addPlatform(x: number, y: number, width: number, height: number) {
    const platform = this.platforms.getFirstDead();
    platform.reset(x, y);
    platform.scale.x = width;
    platform.scale.y = height;
    platform.body.immovable = true;

    return platform;
  }

  addPlayer(options: any = {}) {
    const player = this.game.add.sprite(
      options.x || this.game.world.centerX,
      this.game.world.height - options.y - Game.playerJumpHeight,
      'player'
    );
    player.scale.set(0.2);
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
    let dx = 0;

    if (this.cursors.up.isDown) {
      this.player.y -= Game.playerSpeed;
    }

    if (this.cursors.right.isDown) {
      dx = Game.playerSpeed;
    }
    else if (this.cursors.left.isDown) {
      dx = -Game.playerSpeed;
    }

    this.player.x += dx;

    // Set bounds as the player moves
    // http://codepen.io/jackrugile/pen/fqHtn
    if (dx) {
      this.game.world.setBounds(dx, 0, this.game.world.width + dx, this.game.height);
      this.savePlayerPosition();
    }
  }

  render() {
    this.game.debug.cameraInfo(this.game.camera, 32, 32);
  }
}
