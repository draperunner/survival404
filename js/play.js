var playState = {

    create: function() {

        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.rand = new Phaser.RandomDataGenerator();

        // Keyboard
        this.cursor = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.UP,
            Phaser.Keyboard.DOWN, Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT]);
        this.wasd = {
            up: game.input.keyboard.addKey(Phaser.Keyboard.W),
            left: game.input.keyboard.addKey(Phaser.Keyboard.A),
            right: game.input.keyboard.addKey(Phaser.Keyboard.D)
        };

        // Starry background
        var starEmitter = game.add.playerExplosionEmitter(game.world.centerX, 0, 200);
        starEmitter.alpha = 0.6;
        starEmitter.width = game.world.width;
        starEmitter.makeParticles('pixel');
        starEmitter.minParticleScale = 0.2;
        starEmitter.maxParticleScale = 0.7;
        starEmitter.setYSpeed(100, 300);
        starEmitter.setXSpeed(-1, 1);
        starEmitter.start(false, 5000, 80, 0);
        starEmitter.gravity = 0;

        // Create particle playerExplosionEmitter for explosion effect
        this.enemyExplosionEmitter = game.add.playerExplosionEmitter(0, 0, 15);
        this.enemyExplosionEmitter.makeParticles('redpixel');
        this.enemyExplosionEmitter.setYSpeed(-150, 150);
        this.enemyExplosionEmitter.setXSpeed(-150, 150);
        this.enemyExplosionEmitter.gravity = 0;

        // Create particle emitter for explosion effect
        this.playerExplosionEmitter = game.add.playerExplosionEmitter(0, 0, 15);
        this.playerExplosionEmitter.makeParticles('pixel');
        this.playerExplosionEmitter.setYSpeed(-150, 150);
        this.playerExplosionEmitter.setXSpeed(-150, 150);
        this.playerExplosionEmitter.gravity = 0;

        // Player
        this.player = game.add.sprite(game.width / 2, game.height - 50, 'player');
        this.player.anchor.setTo(0.5, 0);
        game.physics.arcade.enable(this.player);
        this.player.body.collideWorldBounds = true;

        // Create enemies
        this.enemies = game.add.group();
        this.enemies.createMultiple(30, 'four');
        this.enemies.createMultiple(20, 'zero');
        this.enemies.setAll('checkWorldBounds', true);
        this.enemies.setAll('outOfBoundsKill', true);
        this.enemies.enableBody = true;

        this.enemyVelocity = 300;

        // Is true for 5 seconds if bonus type "nuke" has been received.
        // Enemies will not be released if true.
        this.nuked = false;

        // Allow random horizontal velocity for enemies after 50 seconds elapsed game time.
        this.enemyXVelocity = false;
        game.time.events.add(50000, function(){this.enemyXVelocity = true;}, this);

        // Create bonus
        this.bonus = game.add.sprite(-50, 50, 'bonus');
        this.bonus.anchor.setTo(0.5, 0.5);
        this.bonus.reset((Math.random() * game.width - this.bonus.width / 2), -this.bonus.height / 2);
        game.physics.arcade.enable(this.bonus);
        this.bonus.collideWorldBounds = true;
        this.bonus.outOfBoundsKill = true;

        // Create bullets
        this.bullets = game.add.group();
        this.bullets.enableBody = true;
        this.bullets.createMultiple(100, 'pixel');
        this.bullets.setAll('anchor.x', 0.5);
        this.timeForNextShot = 0;

        // Score for current game
        this.score = 0;

        // High score
        if (!localStorage.getItem('highScore'))
            localStorage.setItem('highScore', 0);

        // Score label
        this.scoreLabel = game.add.text(20, 20, 'Time survived: 0',
            { font: '18px Arial', fill: '#fff' });

        // Highscore label
        this.highscoreLabel = game.add.text(20, 50, 'Highscore: ' + Math.floor(localStorage.getItem('highScore') / 1000),
            { font: '18px Arial', fill: '#fff' });

        // Ammo label
        this.ammoLabel = game.add.text(20, 80, 'Ammo: 1000',
            { font: '18px Arial', fill: '#fff' });
        this.ammo = 200;

        // Initial 404 message. Flies away and disappears after 4 seconds.
        this.addInitial404Message();

        // Bonus type text labels. Will be shown when corresponding bonus is received
        this.ammoText = game.add.text(game.world.centerX, game.world.centerY, "+200 Ammo",
            { font: '50px Arial', fill: "#fff" });
        this.ammoText.anchor.setTo(0.5, 0.5);
        this.slowmoText = game.add.text(game.world.centerX, game.world.centerY, "Slow motion",
            { font: '50px Arial', fill: "#fff" });

        this.nukeText = game.add.text(game.world.centerX, game.world.centerY, "Nuke!",
            { font: '50px Arial', fill: "#fff" });

        // Center their anchor point
        this.ammoText.anchor.setTo(0.5, 0.5);
        this.slowmoText.anchor.setTo(0.5, 0.5);
        this.nukeText.anchor.setTo(0.5, 0.5);

        // Initially hidden:
        this.ammoText.alpha = 0;
        this.slowmoText.alpha = 0;
        this.nukeText.alpha = 0;


        // Release an enemy every 50 ms
        game.time.events.loop(50, this.releaseEnemy, this);

        // Release a bonus every 7 seconds
        game.time.events.loop(7000, this.releaseBonus, this);

    },

    update: function() {
        game.physics.arcade.collide(this.player, this.layer);
        game.physics.arcade.overlap(this.player, this.enemies, this.restart, null, this);
        game.physics.arcade.overlap(this.player, this.bonus, this.receiveBonus, null, this);
        game.physics.arcade.overlap(this.enemies, this.bullets, this.killEnemy, null, this);
        game.physics.arcade.overlap(this.zeros, this.bullets, this.killEnemy, null, this);

        this.movePlayer();

        if (this.cursor.up.isDown || this.wasd.up.isDown) {
            this.fire();
        }

        // Score equals the elapsed time since game start
        this.score += game.time.elapsed;

        // Update text labels
        this.scoreLabel.setText("Time survived: " + Math.floor(this.score / 1000));
        if (localStorage.getItem('highScore') <= 0) this.highscoreLabel.setText("Highscore: " + Math.floor(this.score / 1000));
        this.ammoLabel.setText("Ammo: " + this.ammo);

    },

    releaseEnemy: function() {
        var enemy = this.enemies.getFirstDead();
        if (!enemy || this.nuked) {return;}
        game.physics.arcade.enable(enemy);
        enemy.reset(Math.floor(Math.random() * game.width - enemy.width), -enemy.height);
        enemy.body.velocity.y = this.enemyVelocity;
        if (this.enemyXVelocity) {
            enemy.body.velocity.x = (Math.random() - 0.5) * 70;
        }
    },

    releaseBonus: function() {
        console.log("Bonus released");
        this.bonus.revive();
        this.bonus.reset((Math.random() * game.width - this.bonus.width / 2), -this.bonus.height / 2);
        this.bonus.body.velocity.y = 250;
        this.bonus.body.angularVelocity = 50;
        game.add.tween(this.bonus.scale).to({x: 1.2, y: 1.2}, 500).to({x: 0.8, y: 0.8}, 500).loop().start();
    },

    movePlayer: function() {
        if (this.cursor.left.isDown || this.wasd.left.isDown) {
            this.player.body.velocity.x = -300;
        }
        else if (this.cursor.right.isDown || this.wasd.right.isDown) {
            this.player.body.velocity.x = 300;
        }
        else {
            this.player.body.velocity.x = 0;
        }
    },

    fire: function() {

        if(this.timeForNextShot < game.time.now && this.ammo > 0) {

            var bullet = this.bullets.getFirstDead();

            if (! bullet) {return;}

            bullet.reset(this.player.x, this.player.y);
            bullet.body.velocity.y = -300;
            bullet.body.velocity.x = (Math.random() - 0.5) * 10;
            bullet.checkWorldBounds = true;
            bullet.outOfBoundsKill = true;

            this.timeForNextShot = game.time.now + 100;
            this.ammo -= 1;
            this.game.add.tween(this.player).to({y:this.player.y + 5}, 50).to({y: this.player.y}, 50).start();

        }
    },

    receiveBonus: function(player, bonus) {

        bonus.kill();

        var bonusTypes = ["ammo", "slow-motion", "nuke"];
        var bonus = bonusTypes[Math.floor(Math.random() * 3)];
        if (bonus === "ammo") {
            this.ammo += 200;
            this.ammoText.alpha = 1;
            game.add.tween(this.ammoText).to({alpha: 0}, 2000).start();
        }
        else if (bonus === "slow-motion") {
            this.enemyVelocity = 150;
            game.time.events.add(5000, function() {
                this.enemyVelocity = 300;
            }, this);
            this.slowmoText.alpha = 1;
            game.add.tween(this.slowmoText).to({alpha: 0}, 2000).start();
        }
        else if (bonus === "nuke") {
            this.enemies.callAll('kill');
            this.nuked = true;
            game.time.events.add(5000, function(){this.nuked = false;}, this);
            this.nukeText.alpha = 1;
            game.add.tween(this.nukeText).to({alpha: 0}, 2000).start();
        }

        // Flash background color
        game.stage.backgroundColor = '#fff';
        game.time.events.add(50, function(){
            game.stage.backgroundColor = '#404';
        }, this);

    },

    killEnemy: function(enemy, bullet) {
        this.enemyExplosionEmitter.x = enemy.x;
        this.enemyExplosionEmitter.y = enemy.y;
        this.enemyExplosionEmitter.start(true, 500, null, 15);
        enemy.kill();
    },

    restart: function() {
        if (this.score > localStorage.getItem('highScore')) {
            localStorage.setItem('highScore', this.score);
        }
        this.player.kill();
        this.playerExplosionEmitter.x = this.player.x;
        this.playerExplosionEmitter.y = this.player.y;
        this.playerExplosionEmitter.start(true, 1000, null, 15);
        game.time.events.add(1500, function(){game.state.start('play')}, this);
    },

    addInitial404Message: function() {
        this.fourOFour = game.add.text(game.world.centerX, game.world.centerY, 'Page not found',
            { font: '50px Arial', fill: '#f00' });

        this.untilFound = game.add.text(game.world.centerX, game.world.centerY + 60, 'Survive until it is',
            { font: '25px Arial', fill: '#fff' });

        this.untilFound.alpha = 0;
        //game.time.events.add(1000, function() {this.untilFound.fill = '#fff'}, this);

        this.fourOFour.anchor.setTo(0.5, 0.5);
        this.untilFound.anchor.setTo(0.5, 0.5);

        // Tweens for text "Page not found"
        // Fly away and rotate after 4 seconds
        game.time.events.add(4000, function() {
            game.add.tween(this.fourOFour.scale).to({x: 0, y: 0},3000).start();
            game.add.tween(this.fourOFour).to({angle: -20, x: 0, y: 0},3000).easing(Phaser.Easing.Exponential.In).start();
        }, this);

        // Tweens for text "Survive until it is"
        // Fade in after 2 sec:
        game.time.events.add(2000, function() {
            game.add.tween(this.untilFound).to({alpha: 1}, 1000).start();
        }, this);

        // Fly away and rotate after 4 seconds
        game.time.events.add(4000, function() {
            game.add.tween(this.untilFound.scale).to({x: 0, y: 0},3000).start();
            game.add.tween(this.untilFound).to({angle: -20, x: 0, y: 0},3000).easing(Phaser.Easing.Exponential.In).start();
        }, this);

        // Destroy text labels after 10 seconds.
        game.time.events.add(10000, function(){this.untilFound.destroy(); this.fourOFour.destroy()}, this);
    }
};