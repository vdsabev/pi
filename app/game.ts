import { piDigits } from './pi';
import { Player } from './player';
import { Unit } from './unit';

export class Game {
  private static controls = {
    crouch: Phaser.Keyboard.S,
    jump: Phaser.Keyboard.SPACEBAR,
    left: Phaser.Keyboard.A,
    right: Phaser.Keyboard.D
  };

  private game: Phaser.Game;
  private otherPlayers: Player[] = [];
  private player: Player;
  private playerID = window.prompt('Enter your player ID:', '-KKFbucEljzXDLEC-49X');
  private tiles: Phaser.Group;

  preload() {
    this.game.stage.backgroundColor = 0x000000;
    this.game.load.image('player', 'assets/sprites/player.png');
    this.game.load.image('tile', 'assets/sprites/tile.png');
  }

  create() {
    Unit.value = this.game.height / Unit.total;
    Unit.inverseValue = Unit.total / this.game.height;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.time.advancedTiming = true;

    this.watchOnlinePlayers();
    this.addTiles();
  }

  addTiles() {
    this.tiles = this.game.add.group();
    this.tiles.enableBody = true;

    // Create left wall
    this.addTile(
      -this.game.width * 0.5, 0,
      this.game.width * 0.5 + Unit.value, this.game.height
    );

    // Create floor
    this.addTile(
      0, this.game.height - Unit.value,
      this.game.width,
      Unit.value
    );

    // Create ceiling
    this.addTile(0, 0, this.game.width + 1000 * Unit.value, Unit.value);

    // Create digits
    _(1000).times((index) => {
      const offsetDigit = piDigits[index] + 1;
      this.addTile(
        this.game.width + index * Unit.value, this.game.height - offsetDigit * Unit.value,
        Unit.value, offsetDigit * Unit.value
      );
    });
  }

  addTile(x: number, y: number, width: number, height: number) {
    const tile = this.tiles.create(x, y, 'tile');
    tile.scale.set(width, height);
    tile.body.immovable = true;

    return tile;
  }

  watchOnlinePlayers() {
    firebase.database().ref('players').on('child_added', (playerSnapshot: any) => {
      const playerVal = playerSnapshot.val();
      const position: Phaser.Pointer = playerVal.position || { x: 1, y: 1 };
      const player = this.createPlayer(position.x, position.y, playerSnapshot.key);
      if (player.id === this.playerID) {
        this.player = player;
        this.player.body.collideWorldBounds = true;
        this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);
        this.player.centerCamera();
      }
      else {
        this.otherPlayers.push(player);
        player.watchPosition();
      }
    });
  }

  createPlayer(x = this.game.width * 0.5, y = this.game.height * 0.5, id: string): Player {
    const player = new Player(this.game, x, this.game.height - y, id);
    return player;
  }

  update() {
    if (this.player) {
      this.game.physics.arcade.collide(this.player, this.tiles);
      this.readInputControls();
    }

    _(this.otherPlayers).forEach((player) => {
      this.game.physics.arcade.collide(player, this.tiles);
    });
  }

  readInputControls() {
    if (this.game.input.keyboard.isDown(Game.controls.crouch)) {
      this.player.crouch();
    }
    else {
      this.player.stand();
    }

    if (this.game.input.keyboard.isDown(Game.controls.left)) {
      this.player.moveLeft();
    }
    else if (this.game.input.keyboard.isDown(Game.controls.right)) {
      this.player.moveRight();
    }
    else {
      this.player.stop();
    }

    if (this.game.input.keyboard.isDown(Game.controls.jump)) {
      if (this.player.canJump()) {
        this.player.jump();
      }
      else if (this.player.canDoubleJump()) {
        this.player.doubleJump();
      }
      this.player.isPressingJump = true;
    }
    else {
      this.player.isPressingJump = false;
    }

    if (this.player.body.deltaX()) {
      this.player.centerCamera();
      this.player.savePosition();
    }
  }

  render() {
    this.game.debug.text(`${this.game.time.fps} FPS`, 32, 32);
    this.game.debug.cameraInfo(this.game.camera, 32, 48);
  }
}
