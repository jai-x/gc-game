'use strict';

// Helper
const randInt = (min, max) => ( Math.floor( Math.random() * ( max - min ) ) + min );

// Player movement variables
const TRAVEL_SPEED = 500;
const JUMP_SPEED   = 900;
const GRAVITY      = 2200;

// Game config and initialisation
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  antialias: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY }
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
});

// Global objects
let control;
let player;
let monies;

// Load game assets
function preload() {
  this.load.image('sky', './assets/sky.png');
  this.load.image('platform', './assets/platform.png');
  this.load.image('bank', './assets/bank.png');
  this.load.image('money', './assets/money.png');
  this.load.image('ground', './assets/ground.png');
  this.load.spritesheet('gccool', './assets/gccool.png', {
    frameWidth: 290,
    frameHeight: 298
  });
};

// Initialise game objects before main game loop
function create() {
  // Add sky image background
  this.add.image(400, 300, 'sky');

  const bank = this.physics.add.staticGroup();
  bank.create(700, 470, 'bank');

  // Create platform group as a collection of static physics objects
  const platforms = this.physics.add.staticGroup();
  // Add sprites to the platform group and set positions
  platforms.create(400, 590, 'ground');
  platforms.create(200, 450, 'platform');
  platforms.create(600, 300, 'platform');
  platforms.create(200, 150, 'platform');

  // Use `gccool` sprite sheet as a physics based player
  player = this.physics.add.sprite(520, 500, 'gccool');
  // Set physics attributes
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);
  player.setScale(0.25);

  // Create animations from `gccool` sprite sheet
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('gccool', { start: 1, end: 3 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('gccool', { start: 5, end: 7 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'turn',
    frames: [ { key: 'gccool', frame: 4 } ],
    frameRate: 20,
  });
  this.anims.create({
    key: 'jumpLeft',
    frames: [ { key: 'gccool', frame: 0 } ],
    frameRate: 20,
  });
  this.anims.create({
    key: 'jumpRight',
    frames: [ { key: 'gccool', frame: 8 } ],
    frameRate: 20,
  });

  // Create the `monies` physics group
  monies = this.physics.add.group();

  // generate monies
  makeItRain();

  // Ensure `player` and `platforms` collide as physics objects
  this.physics.add.collider(player, platforms);

  // Ensure `monies` and `plaforms` collide as physics objects
  this.physics.add.collider(monies, platforms);

  // Assign callback when `player` and any child of the `monies` group overlap
  this.physics.add.overlap(player, monies, getMonies, null, this);

  // Assign callback when `player` and the `bank` overlap
  this.physics.add.overlap(player, bank, debounce(directDebit, 1000, false), null, this);

  // Create a control object to captire keyboard input
  control = this.input.keyboard.createCursorKeys();
};

function directDebit() {
  monies.children.entries = new Array();
  makeItRain();
};

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);
    if (immediate && !timeout) func.apply(context, args);
  };
};

function viableCoords() {
  const newX = randInt(20, 780);
  const newY = randInt(0, 300);
  if (newX > 650 && newY > 300) {
    return viableCoords();
  } else {
    return { x: newX, y: newY };
  }
};

// Generate monies
function makeItRain() {
  let amount = randInt(10, 15);
  while (amount > 0) {
    const { x, y } = viableCoords();
    monies.create(x, y, 'money');
    amount--;
  }

  monies.children.iterate(child => {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    child.setScale(0.2);
  });
};

// `player` / `monies` overlap callback
function getMonies(player, cash) {
  // Hide the individual cash-money
  cash.disableBody(true, true);
};

// Run once per frame
function update() {
  move();
  animate();
};

function move() {
  // Left / Right
  if (control.left.isDown) {
    player.setVelocityX(-TRAVEL_SPEED);
  } else if (control.right.isDown) {
    player.setVelocityX(TRAVEL_SPEED);
  } else {
    player.setVelocityX(0);
  }
  // Jump
  if (control.space.isDown && player.body.touching.down) {
    player.setVelocityY(-JUMP_SPEED);
  }

  // FUN
  if (control.down.isDown && player.body.touching.down) {
    makeItRain();
  }
};

function animate() {
  if (player.body.touching.down && control.left.isDown) {
    player.anims.play('left', true);
    return;
  }

  if (player.body.touching.down && control.right.isDown) {
    player.anims.play('right', true);
    return;
  }

  if (!player.body.touching.down && control.left.isDown) {
    player.anims.play('jumpLeft', true);
    return;
  }

  if (control.right.isDown) {
    player.anims.play('jumpRight', true);
    return;
  }

  player.anims.play('turn');
};
