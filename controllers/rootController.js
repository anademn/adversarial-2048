require('dotenv').config();
const
  debug = require('debug')('example'),
  express = require('express'),
  router = express.Router();

router.get('/', async (req, res) => {
  res.render('home')
});

module.exports = router
