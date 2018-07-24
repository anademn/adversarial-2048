// UI events
$.addEvents({
  '': {
    load () {
      game.emit('init-settings')
    },
    keydown (e) {
      //let keys = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
      let keys = { up: 'w', down: 's', left: 'a', right: 'd' };
      if (!game.getState().playing) return;
      e.stopPropagation();
      let { dims, board, score } = game.getState(), post = Array(dims), i, j, k,
          dir = false, changed = false, playable = false;
      function combine (a, v) {
        if (!v) return a;
        if (k == v) {
          a[a.length - 1] = 2 * v;
          k = 0;
          score += 2 * v
        } else a.push(k = v)
        return a
      }

      switch (e.key) {
        case keys.up: dir = true;
        case keys.down:
        for (i = 0; i < dims; k = 0, i++) {
          comb = dir ?
            board[i].reduce(combine, []) :
            board[i].slice().reverse().reduce(combine, []).reverse();
          post[i] = dir ?
            comb.concat(Array(dims).fill(0)).slice(0,dims) :
            Array(dims).fill(0).concat(comb).slice(-dims)
        }
        break;

        case keys.left: dir = true;
        case keys.right:
        let inter = Array(dims);
        for (i = 0; i < dims; k = 0, i++) {
          comb = dir ?
            board.map(a => a[i]).reduce(combine, []) :
            board.map(a => a[i]).slice().reverse().reduce(combine, []).reverse();
          inter[i] = dir ?
            comb.concat(Array(dims).fill(0)).slice(0,dims) :
            Array(dims).fill(0).concat(comb).slice(-dims);
        }
        inter.forEach((_, i) => post[i] = inter.map((_, j) => inter[j][i]));
        break;

        default: return
      }

      // Test whether post == board
      for (i = 0; i < dims; i++) for (j = 0; j < dims; j++)
        if (post[i][j] != board[i][j]) changed = true;

      if (changed) {
        game.emit('update', post, score);
        game.emit('add-tiles', 1);
        game.emit('render')
      }

      //Test whether game is over
      for (i = 0; i < dims; i++) for (j = 0; j < dims; j++)
        playable = playable || !post[i][j] || (j < dims - 1 && post[i][j] == post[i][j + 1]) ||
          (i < dims - 1 && post[i][j] == post[i + 1][j]);

      if (!playable) game.emit('complete')
    }
  },
  '.mode': {
    click () { game.emit('toggle-mode') }
  },
  '.newgame': {
    click () { game.emit('start') }
  }
});

// State machine
let game = new $.Machine(Object.seal({
  playing: false,
  dims: null,
  board: null,
  score: null,
  highscores: null,
  startColour: '#ff4136',
  endColour: '#0074d9',
  commandList: null
}))

.on('init-settings', function () {
  let dims = parseInt(localStorage.dims);
  try { this.highscores = JSON.parse(localStorage.highscores) }
  catch (e) {
    this.highscores = [{mode: 3, highscore: 0}, {mode: 4, highscore: 0}];
    localStorage.highscores = JSON.stringify(this.highscores);
  }
  if (![3, 4].some(v => v == dims)) dims = localStorage.dims = 4;
  this.board = initBoard(this.dims = dims);
  $('.score')[0].textContent = this.score = 0;
  $('.highscore')[0].textContent = this.highscores.find(x => x.mode == dims).highscore;
  $('.mode')[0].textContent = dims == 3 ? '3×3' : '4×4'
})

.on('toggle-mode', function () {
  let { dims } = this;
  this.dims = dims = dims == 3 ? 4 : 3;
  $('.mode')[0].textContent = dims == 3 ? '3×3' : '4×4';
  this.board = initBoard(dims);
  $('.highscore')[0].textContent = this.highscores.find(x => x.mode == dims).highscore
})

.on('start', function () {
  $('.flash')[0].classList.add('hide');
  this.score = 0;
  this.board = initBoard(this.dims);
  this.playing = true;
  game.emit('add-tiles', 2);
  game.emit('render')
})

.on('update', function (newBoard, newScore) {
  if (newBoard) this.board = newBoard;
  if (newScore) {
    this.score = newScore;
    let { highscores, dims } = this, { highscore } = highscores.find(x => x.mode == dims);
    if (newScore > highscore) {
      $('.highscore')[0].textContent = newScore;
      this.highscores.find(x => x.mode == dims).highscore = newScore;
      localStorage.highscores = JSON.stringify(this.highscores)
    }
  }
})

.on('add-tiles', function (n) {
  let { dims } = this;
  for (let k = 0, i, j; k < n; k++) {
    while (this.board[i = Math.floor(Math.random() * dims)][j = Math.floor(Math.random() * dims)]);
    this.board[i][j] = Math.random() < .1 ? 4 : 2;
  }
})

.on('render', function () {
  let { dims, board, score, highscores } = this;
  $('.cell').forEach((el, k) => {
    let i = k % dims, j = Math.floor(k / dims);
    el.style.background = board[i][j] ? lerpColours(Math.log2(board[i][j] / 2) / dims / dims, this.startColour, this.endColour) : '';
    el.style.fontSize = (dims == 3 ? 24 : 17) / Math.max(2, board[i][j].toString().length) + 'vmin';
    el.textContent = board[i][j] ? board[i][j] : ''
  });
  $('.score')[0].textContent = score
})

.on('complete', function () {
  this.playing = false;
  let flash = $('.flash')[0];
  flash.textContent = 'Game over';
  flash.classList.remove('hide')
})

.on('chat', function (data) {
  switch (data.eventType) {
    case 'message':
    var { username, message } = data;
    if (message[0] != '!') break;
    console.log(`Command (${username}): ${message}`);
    this.commandList.push({ username, message });
    break;

    case 'connected':
    console.log('Connected')
    this.commandList = [];
    break;
    case 'disconnected':
    console.log(`Disconnnected:${data.disconnected}`)
    break;
  }
});

function lerpColours (t, sc, ec) {
  sc = sc.match(/#([0-9a-f]{6})/)[1].match(/.{2}/g).map(v => parseInt(v, 16));
  ec = ec.match(/#([0-9a-f]{6})/)[1].match(/.{2}/g).map(v => parseInt(v, 16));
  return '#' + sc.map((v, i) => Math.floor(v + t * (ec[i] - v)).toString(16).padStart(2, '0')).join('')
}

function initBoard (dims) {
  $('.board')[0].classList.remove('dim3', 'dim4');
  $('.board')[0].classList.add('dim' + dims);
  $('.cell').forEach(el => el.remove());
  for (let i = 0; i < dims; i++) for (let j = 0; j < dims; j++) $.load('cell', '.board');
  return new Array(dims).fill(0).map(() => new Array(dims).fill(0));
}

if (0) {
  let ws = new WebSocket('ws://localhost:7999/video');
  ws.onmessage = e => {
    let data;
    try { data = JSON.parse(e.data) } catch (e) { return }
    let kl = Object.keys(data).length;
    if ('token' in data && kl == 1) {
      console.log('Oauth token received');
      let tmp = document.createElement('template');
      tmp.innerHTML = data.token;
      window.open(tmp.content.firstChild.href, 'oauth', 'left=100,top=100,width=420,height=540')
    } else if ('eventType' in data) game.emit('chat', data)
  }
}
