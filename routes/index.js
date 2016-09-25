var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs')
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/q/oxford/:word', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    '--ssl-protocol=any',
    path.join(__dirname, '../phantomjs/oxford-definition.js'),
    req.params.word
  ]

  childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(err) {
      responseObj.send(err);
    } else {
      responseObj.send(JSON.parse(stdout));
    }
  });
});

router.get('/q/zargan/:word', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    '--ssl-protocol=any',
    path.join(__dirname, '../phantomjs/zargan-definition.js'),
    req.params.word
  ]

  childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(err) {
      responseObj.send(err);
    } else {
      responseObj.send(JSON.parse(stdout));
    }
  });
});

router.post('/login/', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    '--ssl-protocol=any',
    '--ignore-ssl-errors=yes',
    path.join(__dirname, '../phantomjs/memrise-courses.js'),
    req.body.username,
    req.body.password,
    'courselist'
  ];

  childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(err) {
      console.log(err);
      responseObj.send(err);
    } else {
      console.log(stdout);
      responseObj.send(JSON.parse(stdout));
    }
  });
});

module.exports = router;
