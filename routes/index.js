var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs')
var express = require('express');
var router = express.Router();
var fs = require('fs');
var http = require('http');
var mongodb = require('../db/mongodb');
var tasks = require('../db/tasks');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'memvoc' });
});

router.get('/memvoc', function(req, res, next) {
  res.render('memvoc', { title: 'memvoc' });
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

router.post('/newlogin/', function(req, res, next) {
  var responseObj = res;
  var childArgs = [
    path.join(__dirname, '../phantomjs/memrise-courses.js'),
    req.body.username,
    req.body.password,
    'justcourselist'
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

router.post('/addToDB', function(req, res, next) {
  var courseId = req.body.courseId;
  var format = req.body.format;
  var addWordsToDb = req.body.addToDB == 'true';
  var wordList = JSON.parse(decodeURIComponent(req.body.wordList));

  mongodb.insertWordList(wordList, courseId, format, addWordsToDb, function(result) {
    if(result.isSuccessful) {
      tasks.wordListTask(req.body.username, req.body.password, courseId);
    }
    res.send(result);
  });
});

router.post('/addtomemrise/', function(req, res, next) {
  var responseObj = res;
  var soundPath = path.join(__dirname, '../sounds');
  global.requestCounter++;
  var requestFolder = soundPath + '/' + new Date().getTime() + '_' + global.requestCounter;
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
    requestFolder
  ];



/*
  if(fs.existsSync(soundPath)) {
    fs.readdirSync(soundPath).forEach(function(file,index){
        fs.unlinkSync(soundPath + "/" + file);
      });
    fs.rmdirSync(soundPath);
  }
*/

  if(!fs.existsSync(soundPath)) {
    fs.mkdirSync(soundPath);
  }
  fs.mkdirSync(requestFolder);

  var prs = JSON.parse(decodeURIComponent(req.body.pronunciations));
  prs.forEach(function(item, index) {
    if(item.pronunciation && item.pronunciation.length > 0) {
      var filePath = path.join(requestFolder, '/' + item.word + '.mp3');
      var file = fs.createWriteStream(filePath);
      var request = http.get(item.pronunciation, function(response) {
        response.pipe(file);
      });
    }
  });

  childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(fs.existsSync(requestFolder)) {
      fs.readdirSync(requestFolder).forEach(function(file,index){
          fs.unlinkSync(requestFolder + "/" + file);
        });
      fs.rmdirSync(requestFolder);
    }
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
