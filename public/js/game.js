// UI events
$.addEvents({
  '': {
    load () {
      game.emit('init-settings')
    }
  }
});

// State machine
let game = new $.Machine(Object.seal({
  dims: null,
  commandList: null
}))

.on('init-settings', function () {
  let { dims } = localStorage;
  if (![3, 4].some(v => v == dims)) dims = localStorage.dims = 4;
  this.dims = dims;
  for (let i = 0; i < dims; i++) for (let j = 0; j < dims; j++) $.load('cell', '.board');
  game.emit('add-tiles', 2)
})

.on('add-tiles', function (n) {
  for (let i = 0; i < n; i++);
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
