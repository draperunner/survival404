var loadState = {

	preload: function () {		
		// Add a loading label 
		var loadingLabel = game.add.text(game.world.centerX, 150, 'loading...', { font: '30px Arial', fill: '#ffffff' });
		loadingLabel.anchor.setTo(0.5, 0.5);

		// Add a progress bar
		var progressBar = game.add.sprite(game.world.centerX, 200, 'progressBar');
		progressBar.anchor.setTo(0.5, 0.5);
		game.load.setPreloadSprite(progressBar);

		// Load all assets
        game.load.image('player', 'assets/player.png');
        game.load.image('four', 'assets/four.png');
        game.load.image('zero', 'assets/zero.png');
        game.load.image('bonus', 'assets/bonus.png');
        game.load.image('pixel', 'assets/pixel.png');
        game.load.image('redpixel', 'assets/redpixel.png');

	},

	create: function() { 
		game.state.start('play');
	}
};