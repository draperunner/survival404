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
        var emitter = game.add.emitter(game.world.centerX, 0, 200);
        emitter.alpha = 0.6;
        emitter.width = game.world.width;
        emitter.makeParticles('pixel');
        emitter.minParticleScale = 0.2;
        emitter.maxParticleScale = 0.7;
        emitter.setYSpeed(100, 300);
        emitter.setXSpeed(-1, 1);
        emitter.start(false, 5000, 80, 0);
        emitter.gravity = 0;

        // Player
        this.player = game.add.sprite(game.width / 2, game.height - 50, 'player');
        this.player.anchor.setTo(0.5, 0);
        game.physics.arcade.enable(this.player);
        this.player.body.collideWorldBounds = true;

        // Create fours
        this.fours = game.add.group();
        this.fours.createMultiple(30, 'four');
        this.fours.setAll('checkWorldBounds', true);
        this.fours.setAll('outOfBoundsKill', true);
        this.fours.enableBody = true;

        // Create zeros
        this.zeros = game.add.group();
        this.zeros.createMultiple(30, 'zero');
        this.zeros.setAll('checkWorldBounds', true);
        this.zeros.setAll('outOfBoundsKill', true);
        this.zeros.enableBody = true;

        this.enemyVelocity = 300;
        this.enemyXVelocity = false;
        // Allow random horizontal velocity for enemies after 50 seconds elapsed game time.
        game.time.events.add(50000, function(){this.enemyXVelocity = true;}, this);

        // Create bonuses
        this.bonuses = game.add.group();
        this.bonuses.createMultiple(10, 'bonus');
        this.bonuses.setAll('checkWorldBounds', true);
        this.bonuses.setAll('outOfBoundsKill', true);
        this.bonuses.setAll('anchor.x', 0.5);
        this.bonuses.setAll('anchor.y', 0.5);

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
            { font: '18px Arial', fill: '#ffffff' });

        // Highscore label
        this.highscoreLabel = game.add.text(20, 50, 'Highscore: ' + Math.floor(localStorage.getItem('highScore') / 1000),
            { font: '18px Arial', fill: '#ffffff' });

        // Ammo label
        this.ammoLabel = game.add.text(20, 80, 'Ammo: 1000',
            { font: '18px Arial', fill: '#ffffff' });
        this.ammo = 200;

        // Initial 404 message. Disappears after 4 seconds.
        this.fourOFour = game.add.text(game.world.centerX, game.world.centerY, 'Page not found',
            { font: '50px Arial', fill: '#f00' });
        this.fourOFour.anchor.setTo(0.5, 0.5);
        game.time.events.add(4000, function() {
            game.add.tween(this.fourOFour.scale).to({x: 0, y: 0},3000).start();
            game.add.tween(this.fourOFour).to({angle: -20, x: 0, y: 0},3000).easing(Phaser.Easing.Exponential.In).start();
        }, this);
        game.time.events.add(10000, function(){this.fourOFour.destroy()}, this);

        // Create particle emitter for explosion effect
        this.emitter = game.add.emitter(0, 0, 15);
        this.emitter.makeParticles('redpixel');
        this.emitter.setYSpeed(-150, 150);
        this.emitter.setXSpeed(-150, 150);
        this.emitter.gravity = 0;

        // Release an enemy every 50 ms
        game.time.events.loop(50, this.releaseEnemy, this);

        // Release a bonus every 7 seconds
        game.time.events.loop(7000, this.releaseBonus, this);

    },

    update: function() {
        game.physics.arcade.collide(this.player, this.layer);
        game.physics.arcade.overlap(this.player, this.fours, this.restart, null, this);
        game.physics.arcade.overlap(this.player, this.zeros, this.restart, null, this);
        game.physics.arcade.overlap(this.player, this.bonuses, this.receiveBonus, null, this);
        game.physics.arcade.overlap(this.fours, this.bullets, this.killEnemy, null, this);
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
        // 66.6% chance of picking a four. Therefore the number of fours will be double the number of zeros.
        var enemy = (Math.random() > 1/3) ? this.fours.getFirstDead() : this.zeros.getFirstDead();
        if (!enemy) {return;}
        game.physics.arcade.enable(enemy);
        enemy.reset(Math.floor(Math.random() * game.width - enemy.width), -enemy.height);
        enemy.body.velocity.y = this.enemyVelocity;
        if (this.enemyXVelocity) {
            enemy.body.velocity.x = (Math.random() - 0.5) * 100;
        }
    },

    releaseBonus: function() {
        var bonus = this.bonuses.getFirstDead();
        if (!bonus) {return;}
        game.physics.arcade.enable(bonus);
        bonus.reset(Math.floor(Math.random() * game.width - bonus.width), -bonus.height);
        bonus.body.velocity.y = 300;
        bonus.body.angularVelocity = 50;
        game.add.tween(bonus.scale).to({x: 1.2, y: 1.2}, 500).to({x: 0.8, y: 0.8}, 500).loop().start();
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
        var bonus = bonusTypes[this.rand.integerInRange(0, 2)];
        console.log(bonus);
        if (bonus === "ammo") {
            this.ammo += 200;
        }
        else if (bonus === "slow-motion") {
            this.enemyVelocity = 150;
            game.time.events.add(5000, function() {
                this.enemyVelocity = 300;
            }, this);
        }
        else if (bonus === "nuke") {
            this.fours.callAll('kill');
            this.zeros.callAll('kill');
        }

        // Flash background color
        game.stage.backgroundColor = '#fff';
        game.time.events.add(50, function(){
            game.stage.backgroundColor = '#404';
        }, this);

    },

    killEnemy: function(enemy, bullet) {
        this.emitter.x = enemy.x;
        this.emitter.y = enemy.y;
        this.emitter.start(true, 500, null, 15);
        enemy.kill();
    },

    restart: function() {
        if (this.score > localStorage.getItem('highScore')) {
            localStorage.setItem('highScore', this.score);
        }
        this.player.kill();
        this.emitter.x = this.player.x;
        this.emitter.y = this.player.y;
        this.emitter.start(true, 1000, null, 15);
        game.time.events.add(1000, function(){game.state.start('play')}, this);
    }

};