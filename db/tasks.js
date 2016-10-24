var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs')
var fs = require('fs');
var http = require('http');
var mongodb = require('./mongodb');

function wordListTask(username, password, courseId) {
  console.log('Word list task is starting');
  setTimeout(function () {
    mongodb.getWordList(courseId, function(result) {
      if(result.isSuccessful) {
        var wordList = result.data;
        if(wordList && wordList.length > 0) {
          var data = '';
          wordList.forEach(function(item, index) {
            data += item.format.toLowerCase().replace(/,/g, '\t').replace(/word/g, item.word).replace(/example/g, item.example).replace(/definition/g, item.definition) + '\n';
          });
          addWordListToMemrise( username, password, wordList, encodeURIComponent(data), encodeURIComponent(JSON.stringify(wordList)), courseId, function(result) {
            if(result.isSuccessful) {
              mongodb.setWordListAsLevelCreated(wordList, function(result) {
                if(result.isSuccessful) {
                  console.log('Word list task finished successfully');
                  wordListTask(username, password, courseId);
                } else {
                  console.error(result);
                }
              });
            } else {
              console.error(result);
            }
          });
        }
      } else {
        console.error(result);
      }
    });
  }, 10);
}

function addWordListToMemrise(username, password, wordList, data, pronunciations, courseId, callback) {
  var soundPath = path.join(__dirname, '../sounds');
  global.requestCounter++;
  var requestFolder = soundPath + '/' + new Date().getTime() + '_' + global.requestCounter;

  var childArgs = [
    '--ssl-protocol=any',
    '--ignore-ssl-errors=yes',
    '--web-security=false',
    path.join(__dirname, '../phantomjs/memrise-courses.js'),
    username,
    password,
    'addlevelandwords',
    data,
    courseId,
    pronunciations,
    requestFolder
  ];

  if(!fs.existsSync(soundPath)) {
    fs.mkdirSync(soundPath);
  }
  fs.mkdirSync(requestFolder);

  wordList.forEach(function(item, index) {
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
      callback({ isSuccessful: false, error: err });
    } else {
      callback(JSON.parse(stdout));
    }
  });
}

exports.wordListTask = wordListTask;
