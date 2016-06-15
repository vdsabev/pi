import { Firebase } from './firebase';
Firebase.initialize();

import { Game } from './game';

const game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS);
game.state.add('game', Game);
game.state.start('game');
