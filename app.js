#!/usr/bin/env node
'use strict';

// Init

require('dotenv').config();
const
  debug = require('debug')('app'),
  debugSrv = require('debug')('server'),
  express = require('express'),
  RateLimit = require('express-rate-limit'),
  helmet = require('helmet'),
  compression = require('compression'),
  /*{ MongoClient } = require('mongodb'),*/
  session = require('express-session'),
  /*MongoStore = require('connect-mongo')(session),*/
  bodyParser = require('body-parser'),
  hbs = require('express-hbs'),
  app = express(),
  expressWs = require('express-ws')(app);
var
  retryConn,
  port = process.env.PORT || 8000,
  host = process.env.HOST || '0.0.0.0';
process.env.MONGO_SERVER = process.env.MONGO_SERVER_DEV;

// Db connect

/*(retryConn = () => MongoClient.connect(process.env.MONGO_SERVER, {autoReconnect: true})
  .then(client => {
    debugSrv('Connected to MongoDB');
    return app.db = client.on('close', e => debugSrv('*close %O', e.message))
      .on('reconnect', c => debugSrv('*reconnect %O', c.topology.s.host + ":" + c.topology.s.port))
      .db('example')
  })
  .catch(err => {
    debugSrv('*err %s', err.name);
    return new Promise(resolve => setTimeout(resolve, 1000)).then(retryConn)
  })
)().then(db => {*/

  // Middleware

  app.enable('trust proxy');

  var limiter = new RateLimit({
    windowMs: 15*60*1000,
    delayAfter: 100,
    delayMs: 3*1000,
    max: 200,
    message: "Flood limit"
  });

  app.use(helmet());
  app.use(compression());
  app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET,
    name: 'sessionId',
    /*store: new MongoStore({ db }),*/
    store: new session.MemoryStore(),
    /*cookie: {
      secure: true
    },*/
    rolling: true,
    unset: 'destroy',
    proxy: true
  }));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public'));

  app.engine('hbs', hbs.express4({
    layoutsDir: __dirname + '/views/layouts',
    defaultLayout: __dirname + '/views/layouts/main'
  }));
  app.set('view engine', 'hbs');
  app.set('views', __dirname + '/views');

  app.use(limiter);

  // Controllers

  app.use(require('./controllers/wsController.js'));
  app.use(require('./controllers/rootController.js'));

  app.use((req, res) => res.redirect('/'))

  // Listen

  let server = app.listen(port, host, err => {
    if (err) debug('*err %O', err);
    else debugSrv('Listening on port %d', server.address().port)
  })

/*
  let server = app.listen(port, host, err => {
    if (err) throw err;
    debugSrv('Listening on port %d', server.address().port)
  })
}).catch(err => debug('*err %O', err))*/
