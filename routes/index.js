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
    path.join(__dirname, '../phantomjs/oxford-definition.js'),
    req.params.word
  ]

  childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(err) {
      responseObj.send(err);
    } else {
      responseObj.send(stdout);
    }
  });
});

router.get('/q/zargan/:word', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    path.join(__dirname, '../phantomjs/zargan-definition.js'),
    req.params.word
  ]

  childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(err) {
      responseObj.send(err);
    } else {
      responseObj.send(stdout);
    }
  });
});

router.post('/login/', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    path.join(__dirname, '../phantomjs/memrise-courses.js'),
    req.body.username,
    req.body.password
  ];

  childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(stderr) {
      console.log(stderr);
      responseObj.send(stderr);
    }
    else if(err) {
      console.log(err);
      responseObj.send(err);
    } else {
      console.log(stdout);
      responseObj.send(stdout);
    }
  });
});

module.exports = router;
