var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs')
var express = require('express');
var router = express.Router();
var fs = require('fs');
var http = require('http');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/q/cambridge-turkish/:word', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    '--ssl-protocol=any',
    path.join(__dirname, '../phantomjs/cambridge-turkish-definition.js'),
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

router.get('/q/cambridge/:word', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    '--ssl-protocol=any',
    path.join(__dirname, '../phantomjs/cambridge-definition.js'),
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
    '--web-security=false',
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

router.post('/addtomemrise/', function(req, res, next) {
  var responseObj = res;
  var soundPath = path.join(__dirname, '../sounds');
  var childArgs = [
    '--ssl-protocol=any',
    '--ignore-ssl-errors=yes',
    path.join(__dirname, '../phantomjs/memrise-courses.js'),
    req.body.username,
    req.body.password,
    'addwords',
    req.body.data,
    req.body.levelId,
    req.body.courseId,
    req.body.pronunciations,
    soundPath
  ];

  fs.readdirSync(soundPath).forEach(function(file,index){
      fs.unlinkSync(soundPath + "/" + file);
    });
  fs.rmdirSync(soundPath);
  fs.mkdirSync(soundPath);
  var prs = JSON.parse(decodeURIComponent(req.body.pronunciations));
  prs.forEach(function(item, index) {
    console.log(item.word);
    console.log(item.pronunciation);
    if(item.pronunciation && item.pronunciation.length > 0) {
      var filePath = path.join(soundPath, '/' + item.word + '.mp3');
      var file = fs.createWriteStream(filePath);
      var request = http.get(item.pronunciation, function(response) {
        response.pipe(file);
      });
    }
  });

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
