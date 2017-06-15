import { gamepad, gamepadConnected, gamepadDisconnected, gamepadPollData } from './gamepad';

document.title = 'Deja Vu';

// global variables
const BLACK = '#000';
const HEIGHT = 160;
const WIDTH = 176;
const SPRITE_SIZE = 16;
const CHARSET_SIZE = 8; // width & height in pixel of each letter in charset image
const atlas = {
  block: { sprites: { initial: { x: 48, y: 16 } } },
  chest: {
    sprites: {
      initial: { x: 80, y: 0 },
      altered: { x: 96, y: 0 }
    }
  },
  crate: {
    sprites: {
      initial: { x: 48, y: 0 },
      altered: { x: 64, y: 0 }
    }
  },
  door_east: { sprites: { initial: { x: 32, y: 16 } } },
  door_north: { sprites: { initial: { x: 0, y: 16 } } },
  door_south: { sprites: { initial: { x: 16, y: 16 } } },
  sword: { sprites: [ { x: 32, y: 0 } ] },
  hero: {
    speed: 30,
    bounds: { x: 2, y: 1, w: 13, h: 15 },
    sprites: { initial: { x: 0, y: 0 } }
  },
  key: { sprites: [ { x: 16, y: 0 } ] },
  tile: { sprites: { initial: { x: 64, y: 16 } } },
  wall_h: { sprites: { initial: { x: 80, y: 16 } } },
  wall_v: { sprites: { initial: { x: 96, y: 16 } } }
};
const level = [
  [ 'wall_h', 'wall_h', 'door_north', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h' ],
  [ 'wall_v', 'block', 'tile', 'block', 'chest.sword', 'tile', 'crate', 'tile', 'tile', 'chest.sword', 'wall_v' ],
  [ 'wall_v', 'tile', 'tile', 'block', 'block', 'tile', 'tile', 'block', 'tile', 'tile', 'wall_v' ],
  [ 'wall_v', 'tile', 'tile', 'tile', 'crate', 'tile', 'crate', 'chest.key', 'block', 'crate', 'wall_v' ],
  [ 'wall_v', 'chest.sword', 'tile', 'tile', 'block', 'block', 'tile', 'tile', 'crate', 'crate', 'door_east' ],
  [ 'wall_v', 'tile', 'tile', 'block', 'block', 'block', 'crate', 'tile', 'block', 'crate', 'wall_v' ],
  [ 'wall_v', 'tile', 'tile', 'tile', 'crate', 'tile', 'tile', 'crate', 'tile', 'tile', 'wall_v' ],
  [ 'wall_v', 'block', 'tile', 'tile', 'tile', 'block', 'block', 'chest.key', 'block', 'chest.sword', 'wall_v' ],
  [ 'wall_h', 'wall_h', 'door_south', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h', 'wall_h' ]
];
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789.:!-%';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const buffer = document.createElement('canvas');
const buffer_ctx = buffer.getContext('2d');
const bg = document.createElement('canvas');
const bg_ctx = bg.getContext('2d');
const FRAME_DURATION = 0.4; // in seconds
let charset = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUgAAAAICAYAAACbO2brAAAB5klEQVR42uVa2YrDMAw07Fvf9v8/tqWwhTZY18zI9tJAWlLHiqJjPHI1fm8/d/Qcf4c3js6t6JAdUz0T1eeqR1WX2RxLTsY3nh7s/BPP7DspZGbsw+iS0bUSi6gt0Pcf4oOR7+bX88M6Xjd1jL87cNXzo2vF8yP5M4DMzp9dWzaM7HsNCPX8Dv/svq7YSGXfyng2NqJ7Mr5Vvb8SIBHZr3mWPUc1gLsB5P33bwRIhf3+6/gOgNs1v0IQojzxYgPJrysDVfqPAUmPHXoAmWHY5kLR4WDPAYoEt+RbhsisgDM5MwMrAJQByJMZWHeCIfMzMVqNj4h9VfMnC4CI/hkZWYC24r9iX5bpWfMigIwYrJmnqxlEJ4NEACwCSFS+l0AewF+/T2VAEYBUFjJFfFl2VJSAlg8rDBBlcSiAov7PgoiVH0j8ZBgiM474F2IwihK1k0Eie3irtxgY+yifn9njUpSI0QrP7nGx9mf1W72FU8kDRfwp7OPlsYIhsiW2t+iPXQ5mAvyEAGZLLBQgmT9pvH/Su/bY0BKoAyAt+50M4Ih9WYas8F9Fv26ArJbuHxUI0+aws82nugnLtHFU2xtWtqlU2zSybRJM6wjS5sG0kTD+725z6Y6FqI1I1YbTPd5ZYmfbg2ZyHuewlwnHUW0vAAAAAElFTkSuQmCC';
let currentTime;
let entryDoor;
let exitDoor;
let entities;
let animatedEntities;
let hero;
let ITEMS_HEIGHT;
let lastTime;
let requestId;
let resetDoor;
let running;
let tileset = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABQCAYAAADBTPF9AAAEmklEQVR42u2dia7lIAhA+5P+/6cwmWQWnwKyubWQ3GRe72BbjiDSen2ey6UAwM4PDL6b/T1lF0A+2wUa+QvQav3fTXr1vQC48xfB97idiIvdDe+HYcoZAL0AogEOL/gEeKUC+McTzZ8I/VkhUhK+O3godZBBxELcDHiF8MC6A9bHqX+3HoQBam3B6Vs9zNp5Wg/EwVXdpDoZa+jWyLPgSQBqAAy97XSAKLgGIgawNe6Pi2fEC28EsDUeBkwDcKR/BkD4n11hf3MAa+OOYnsLooYqhScNofV3bwbYD2Ol8xg2fHoBdsAE4RgDSMGTAiwgGxP//u39RALEchEWHpriA9772nGpa6fgk2NuLB15RHtsBFCT1EQBdMLvbNj1iuYYDrHwXoaBRHuOALQkhFIeOQKG6XMAOcht8kMlRlb9LorVoGpP0EBsDMD+Hy4RkmaxFADJlIID2P5bMwZSx9oOQo2RGv3OAWobQxOnR6HUO12gjC3NVrW1y9FEXKJPGZsa66QApfpoDXTQC+dWWpCwK/XAU0pp3DxSAlCjf0wxWwLrFoDSz2iaIdG//WnS403DI/S3ZqGjagnwhRn4un7UQ8UCAo/EsnxXNbw4q+mB+mbjB5yfKnzgJ8WPse3CywFqIRage7X2/Jr74WBZj5EAqXAjvWCvvsUDiiXsJcD5AEEawqTQTwPoGBevAQiHAgx7M8o4Lh4FUJM5HgNQm7QQafArQqg6/T8EoOv7BPhSgNZ5oCWERenfGkJneaB5HigxHneBXv0vJjE5jTghiQmuxLgAil5MHYUIp75pIi+o4H9iHnhlKU3xGOa0Skz4PPC6YrbhWdorSmm7H0jerr89iUlJSUlJSUnBF5rsbCOqLe+6RYue55pd9wsBWU47g5/xzqhF39KO5fyea3bdr7SuqerxSmNJ6qei1TjEIhttOxb4ENBZTPaHwVOGVTfATZApw0uXslnaGZ1/xv2DcFleAnwjwEKsFFoNcLRkbbQ4BlvqXYQAqYUmy0OoIPST6/z+/ZRHWQ+wPveoLaweit2Pph3OHlOTmEIv9BG3h67fK7qs0pKBkmsHB21p1iRK2om8l8iFPhFZfUpKSkpKSkrKPWKpbYKxDmipoQLIsszVNdyojNF9XbBhImupoUYU4SNeV4Dg1x7CCtynVuMB5D/NtcL4kQDdbd0EMALiqwCuDoVvgXhMKL4JYCTEVwDcaYCZEKWZnPf+vdnsNu87YRzhIFozac00xZtNu7JqOCQRoIxo0dU+kO6y27JhGmWFV5hnazsAejoUAL7BhqczSwHCwvORDRRjHI8aA6j1AZbOZPEiIFbTzgYYAtHyJHraGOjoSNg7LdrfIYUN82CT/SNDaERNMSKE1h5jKQlazh81/XJ53ylF4SlFZpg7JLhDaL468SFxrXE/4PsECI4VrAEAZuyf9ykpDgAr9sdLgAs8cKd+euBmD4reeiYBbgD4BG/+lAAXelACnJjErACQAAMAPps3zkiAmz3wpP3zPjmTeBz73x2gnx64c/+7yP3zEuCG/e+i989LgIv3v5u1f17OAy/5uccEmFno1fILjM8aJIZzqx4AAAAASUVORK5CYII=';

// implicit window.
addEventListener('load', init);

// global functions

// copy backbuffer onto visible canvas, scaling it to screen dimensions
function blit() {
  ctx.drawImage(
    buffer,
    0, 0, buffer.width, buffer.height,
    0, 0, canvas.width, canvas.height
  );
};

function changeVisibility(e) {
  // event target is document object
  if (e.target.hidden && gamepad) {
    // ¯\_(ツ)_/¯ Chrome also stop sending data for the cached gamepad after changing tab
    // so clear the cached gamepad
    gamepadDisconnected({ gamepad: { index: gamepad.index, connected: false }});
  }

  toggleLoop(!event.target.hidden);
};

function createAnimatedEntity(type, x, y) {
  return {
    frame: 0,
    nextFrame: 0,
    type,
    x,
    y
  }
};

function createEntity(type, x, y, item) {
  return {
    collide: type.indexOf('door') === -1,
    item: item,
    state: 'initial',
    type,
    x: x * SPRITE_SIZE,
    y: y * SPRITE_SIZE
  }
};

function createHero() {
  return {
    bounds: atlas.hero.bounds,
    moveDown: 0,
    moveLeft: 0,
    moveRight: 0,
    moveUp: 0,
    items: {
      now: {
        key: 1,
        sword: 0
      },
      max: {
        key: 1,
        sword: 0
      }
    },
    speed: atlas.hero.speed,
    state: 'initial',
    type: 'hero',
    x: entryDoor.x,
    y: entryDoor.y
  }
};

function endGame() {
  renderText('you won!', (exitDoor.x+SPRITE_SIZE)/2 - 4*CHARSET_SIZE, exitDoor.y + CHARSET_SIZE/2);
  blit();
  toggleLoop(false);
}

function init() {
  // implicit window.
  addEventListener('resize', resize);

  // set back buffer and background canvas size
  buffer.width = WIDTH;
  buffer.height = HEIGHT;
  bg.width = WIDTH;
  bg.height = HEIGHT;
  // scale to fit visible canvas
  resize();

  // load assets
  loadTileset(tileset)
  .then(function(img) { tileset = img; })
  .then(function() { return loadTileset(charset); })
  .then(function(img) { charset = img; })
  // start game
  .then(loadTitle);
};

function keyPressed(keyEvent) {
  switch (keyEvent.which) {
    case 37: // Left arrow
    case 65: // A - QWERTY
    case 81: // Q - AZERTY
      hero.moveLeft = -1;
      hero.moveUp = hero.moveDown = 0;
      break;
    case 38: // Up arrow
    case 90: // W - QWERTY
    case 87: // Z - AZERTY
      hero.moveUp = -1;
      hero.moveLeft = hero.moveRight = 0;
      // prevent itch.io from scrolling the page up/down
      keyEvent.preventDefault();
      break;
    case 39: // Right arrow
    case 68: // D
      hero.moveRight = 1;
      hero.moveUp = hero.moveDown = 0;
      break;
    case 40: // Down arrow
    case 83: // S
      hero.moveDown = 1;
      hero.moveLeft = hero.moveRight = 0;
      // prevent itch.io from scrolling the page up/down
      keyEvent.preventDefault();
      break;
    case 80: // P
      toggleLoop(!running);
      break;
  }
};

function keyReleased(keyEvent) {
  switch (keyEvent.which) {
    case 37: // Left arrow
    case 65: // A - QWERTY
    case 81: // Q - AZERTY
      hero.moveLeft = 0;
      break;
    case 38: // Up arrow
    case 90: // W - QWERTY
    case 87: // Z - AZERTY
      hero.moveUp = 0;
      break;
    case 39: // Right arrow
    case 68: // D
      hero.moveRight = 0;
      break;
    case 40: // Down arrow
    case 83: // S
      hero.moveDown = 0;
      break;
  }
};

function loadTitle() {
  addEventListener('keydown', newGame);
  addEventListener('resize', renderTitle);
  renderTitle();
};

function loadGame() {
  // implicit window.
  removeEventListener('keydown', newGame);
  removeEventListener('resize', renderTitle);
  addEventListener('keydown', keyPressed);
  addEventListener('keyup', keyReleased);
  addEventListener('gamepadconnected', gamepadConnected);
  addEventListener('gamepaddisconnected', gamepadDisconnected);
  document.addEventListener('visibilitychange', changeVisibility);

  entities = [];
  animatedEntities = [];
  loadLevel(level);

  toggleLoop(true);
};

function loadLevel(level) {
  bg_ctx.fillStyle = BLACK;
  bg_ctx.fillRect(0, 0, bg.width, bg.height);

  let x, y;
  for (y = 0; y < level.length; y++) {
    for (x = 0; x < level[y].length; x++) {
      let [type, item] = level[y][x].split('.');

      if (type !== 'tile') {
        // create entity
        const entity = createEntity(type, x, y, item);
        if (type === 'door_north') {
          entryDoor = entity;
        } else if (type === 'door_south') {
          resetDoor = entity;
        } else if (type === 'door_east') {
          exitDoor = entity;
        }
        entities.push(entity);
      }

      // pre-render entity on background
      const sprite = atlas[type].sprites.initial;
      bg_ctx.drawImage(
        tileset,
        sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
        x * SPRITE_SIZE, y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE
      );
    }
  }

  hero = createHero();
  entities.push(hero);

  // TODO make that ugly math nicer to look at
  // pre-render inventory on background
  ITEMS_HEIGHT = y*SPRITE_SIZE + CHARSET_SIZE/2;

  renderText('items', 0, ITEMS_HEIGHT, bg_ctx);
  let sprite = atlas.key.sprites[0];
  bg_ctx.drawImage(
    tileset,
    sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
    WIDTH - 5*SPRITE_SIZE, ITEMS_HEIGHT - CHARSET_SIZE/2, SPRITE_SIZE, SPRITE_SIZE
  );
  sprite = atlas.sword.sprites[0];
  bg_ctx.drawImage(
    tileset,
    sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
    WIDTH - 2*SPRITE_SIZE, ITEMS_HEIGHT - CHARSET_SIZE/2, SPRITE_SIZE, SPRITE_SIZE
  );
};

function loadTileset(tileset) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.addEventListener('load', function() {
      resolve(img);
    })
    img.src = tileset;
  });
};

function loop() {
  if (running) {
    requestId = requestAnimationFrame(loop);
    render();
    currentTime = Date.now();
    update((currentTime - lastTime) / 1000);
    lastTime = currentTime;
  }
};

function newGame(keyEvent) {
  switch (keyEvent.which) {
    case 13: // Enter
      loadGame();
  }
};

function render() {
  // render level
  buffer_ctx.drawImage(bg, 0, 0);

  // render active entities
  for (let entity of entities) {
    renderEntity(entity);
  }

  for (let entity of animatedEntities) {
    renderAnimatedEntity(entity);
  }

  // render items
  renderText(`x${hero.items.now.key}`, WIDTH - 4*SPRITE_SIZE, ITEMS_HEIGHT);
  renderText(`x${hero.items.now.sword}`, WIDTH - SPRITE_SIZE, ITEMS_HEIGHT);

  blit();
};

function renderAnimatedEntity(entity) {
  const sprite = atlas[entity.type].sprites[entity.frame];
  buffer_ctx.drawImage(
    tileset,
    sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
    Math.round(entity.x), Math.round(entity.y), SPRITE_SIZE, SPRITE_SIZE
  );
};

// render an entity onto the backbuffer at 1:1 scale
function renderEntity(entity) {
  const sprite = atlas[entity.type].sprites[entity.state];
  buffer_ctx.drawImage(
    tileset,
    sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
    Math.round(entity.x), Math.round(entity.y), SPRITE_SIZE, SPRITE_SIZE
  );
};

function renderText(text, x, y, ctx = buffer_ctx) {
  for (let i = 0; i < text.length; i++) {
    ctx.drawImage(
      charset,
      // TODO could memoize the characters index or hardcode a lookup table
      alphabet.indexOf(text[i])*CHARSET_SIZE, 0, CHARSET_SIZE, CHARSET_SIZE,
      x + i*(CHARSET_SIZE), y, CHARSET_SIZE, CHARSET_SIZE
    );
  }
};

function renderTitle() {
  requestAnimationFrame(function() {
    buffer_ctx.fillStyle = BLACK;
    buffer_ctx.fillRect(0, 0, buffer.width, buffer.height);

    renderText(document.title.toLowerCase(), 0, 0);

    renderText('you are cursed. locked', 0, 2*CHARSET_SIZE);
    renderText('in an ever repeating', 0, 3*CHARSET_SIZE);
    renderText('room. unravel its' , 0, 4*CHARSET_SIZE);
    renderText('mysteries to lift the' , 0, 5*CHARSET_SIZE);
    renderText('curse and break free.' , 0, 6*CHARSET_SIZE);

    renderText('press enter to start,' , 0, 9*CHARSET_SIZE);
    renderText('arrows or wasd to move' , 0, 10*CHARSET_SIZE);

    renderText('by jerome lecomte' , 0, 13*CHARSET_SIZE);
    renderText('for cga-jam 2017' , 0, 14*CHARSET_SIZE);

    blit();
  });
};

function resetLevel() {
  // move hero back
  hero.y = entryDoor.y;
  // reset his current items to max items
  hero.items.now.key = hero.items.max.key;
  hero.items.now.sword = hero.items.max.sword;
  // close chests and repair crates
  for (let entity of entities) {
    if (entity.type === 'chest' || entity.type === 'crate') {
      entity.state = 'initial';
      entity.collide = true;
    }
  }
};

function resize() {
  // implicit window.
  const scaleToFit = Math.min(innerWidth / WIDTH, innerHeight / HEIGHT);
  canvas.width = WIDTH * scaleToFit;
  canvas.height = HEIGHT * scaleToFit;

  // disable smoothing on scaling
  bg_ctx.mozImageSmoothingEnabled = buffer_ctx.mozImageSmoothingEnabled = ctx.mozImageSmoothingEnabled = false;
  bg_ctx.mozImageSmoothingEnabled = buffer_ctx.msImageSmoothingEnabled = ctx.msImageSmoothingEnabled = false;
  bg_ctx.mozImageSmoothingEnabled = buffer_ctx.imageSmoothingEnabled = ctx.imageSmoothingEnabled = false;
};

function setEntityPosition(entity, elapsedTime) {
  const distance = entity.speed * elapsedTime;
  entity.x += distance * (entity.moveLeft + entity.moveRight);
  entity.y += distance * (entity.moveUp + entity.moveDown);
};

function toggleLoop(value) {
  running = value;
  if (running) {
    lastTime = Date.now();
    loop();
  } else {
    cancelAnimationFrame(requestId);
  }
};

function unloadGame() {
  // implicit window.
  removeEventListener('keydown', keyPressed);
  removeEventListener('keyup', keyReleased);
  removeEventListener('gamepadconnected', gamepadConnected);
  removeEventListener('gamepaddisconnected', gamepadDisconnected);
  document.removeEventListener('visibilitychange', changeVisibility);

  toggleLoop(false);
};

function update(elapsedTime) {
  // TODO extract that into a function
  const gamepadData = gamepadPollData();
  if (gamepadData) {
    // once connected, gamepad overrides keyboard inputs
    if (gamepadData.leftX <= 0) {
      // TODO maybe this would be simpler if moveLeft & moveRight
      // were merged into a single value [-1, 1]
      hero.moveLeft = gamepadData.leftX;
      hero.moveRight = 0;
    } else {
      hero.moveLeft = 0;
      hero.moveRight = gamepadData.leftX;
    }
    if (gamepadData.leftY <= 0) {
      hero.moveUp = gamepadData.leftY;
      hero.moveDown = 0;
    } else {
      hero.moveUp = 0;
      hero.moveDown = gamepadData.leftY;
    }
  }

  setEntityPosition(hero, elapsedTime);

  // collision test between hero and all the entities previous positions
  for (let entity of entities) {
    if (entity === hero) continue;

    if (entity === entryDoor) {
      if (hero.y + hero.bounds.y < entryDoor.y) {
        hero.y = entryDoor.y - hero.bounds.y;
      }
      continue;
    }
    if (entity === resetDoor) {
      if (hero.y + hero.bounds.h > resetDoor.y + SPRITE_SIZE) {
        // history repeats!
        resetLevel();
      }
      continue;
    }
    if (entity === exitDoor) {
      if (hero.x + hero.bounds.w > exitDoor.x + SPRITE_SIZE) {
        endGame();
      }
      continue;
    }

    // AABB collision test
    if (entity.collide &&
        hero.x + hero.bounds.x < entity.x + SPRITE_SIZE &&
        hero.x + hero.bounds.w > entity.x &&
        hero.y + hero.bounds.y < entity.y + SPRITE_SIZE &&
        hero.y + hero.bounds.h > entity.y) {
       // collision!
       // FIXME doesn't work for diagonal move :(
       if (hero.moveRight) {
         hero.x -= hero.x + hero.bounds.w - entity.x;
       }
       if (hero.moveLeft) {
         hero.x += entity.x + SPRITE_SIZE - hero.x - hero.bounds.x;
       }
       if (hero.moveDown) {
         hero.y -= hero.y + hero.bounds.h - entity.y;
       }
       if (hero.moveUp) {
         hero.y += entity.y + SPRITE_SIZE - hero.y - hero.bounds.y;
       }
      if (entity.type === 'chest' &&
          entity.state === 'initial' &&
          hero.items.now.key) {
        // open chest and consumes a key
        entity.state = 'altered';
        hero.items.now.key--;
        if (entity.item) {
          // increase current/max item by 1
          hero.items.now[entity.item]++
          hero.items.max[entity.item]++
          // show item
          animatedEntities.push(createAnimatedEntity(entity.item, entity.x, entity.y - SPRITE_SIZE));
          // empty chest
          entity.item = undefined;
        }
      }
      else if (entity.type === 'crate' &&
               entity.state === 'initial' &&
               hero.items.now.sword) {
        // break crate and consumes a sword
        entity.state = 'altered';
        entity.collide = false;
        hero.items.now.sword--;
      }
    }
  }

  for (let [index, entity] of animatedEntities.entries()) {
    entity.nextFrame += elapsedTime;
    if (entity.nextFrame > FRAME_DURATION) {
      entity.nextFrame -= FRAME_DURATION;
      entity.frame++;
      if (entity.frame >= atlas[entity.type].sprites.length) {
        animatedEntities.splice(index, 1);
      }
    }
  }
};
