import { piDigits } from './pi';
import { Player } from './player';

export class Game {
  private static playerID = window.prompt('Enter your player ID:', '-KKFbucEljzXDLEC-49X');

  private game: Phaser.Game;
  private platforms: Phaser.Group;
  private player: Player;
  private otherPlayers: Player[] = [];

  preload() {
    this.game.stage.backgroundColor = 0x000000;
    this.game.load.image('platform', 'assets/sprites/platform.png');
    this.game.load.image('player', 'assets/sprites/player.png');
  }

  create() {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.time.advancedTiming = true;
    this.game.world.setBounds(0, 0, this.game.width, this.game.height);

    this.watchOnlinePlayers();
    this.addPlatforms();
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

  watchOnlinePlayers() {
    firebase.database().ref('players').on('child_added', (playerSnapshot: any) => {
      const playerVal = playerSnapshot.val();
      const player = this.createPlayer(playerVal.move.x, playerVal.move.y, playerSnapshot.key);
      if (player.id === Game.playerID) {
        this.player = player;
        this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);
      }
      else {
        this.otherPlayers.push(player);
        player.watchMoves();
      }
    });
  }

  createPlayer(x = this.game.width * 0.5, y = this.game.height * 0.5, id: string): Player {
    const player = new Player(this.game, x, this.game.height - y, id);
    return player;
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
    if (this.game.input.mousePointer.isDown && this.player.body.touching.down) {
      const move = this.player.move();
      this.player.saveMove(move);
      // TODO: Save position once movement has stopped
    }

    if (this.player.body.deltaX()) {
      this.followPlayer();
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
