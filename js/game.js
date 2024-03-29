// Initialize Phaser
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameDiv');

// Define states
game.state.add('boot', bootState);
game.state.add('load', loadState);
game.state.add('play', playState);

// Start the "boot" state
game.state.start('boot');