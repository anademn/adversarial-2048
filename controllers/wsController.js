require('dotenv').config();
const
  debugWs = require('debug')('ws'),
  debug = require('debug')('app'),
  express = require('express'),
  router = express.Router();

router.ws('/video', (ws, req) => {

  ws.on('message', function (msg) {
    debug('%O', msg)
  });
  ws.on('close', function (e) { debugWs('Close: %O', e) });
  debug('Open')
});

module.exports = router
