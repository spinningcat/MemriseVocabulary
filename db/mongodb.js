var mongoose = require('mongoose');
var conn = mongoose.connection;

var wordListLimit = 20;

mongoose.Promise = global.Promise;

var dictionarySchema = new mongoose.Schema({
  _id: { type: Number },
  courseId: { type: Number },
  word: { type: String },
  format: { type: String },
  definition: { type: String },
  example: { type: String },
  pronunciation: { type: String },
  isLevelCreated: { type: Boolean, default: false },
  groupId: { type: Number },
  entryDate: { type: Date, default: Date.now }
});

var countersSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number }
});

var dictionary = mongoose.model('dictionary', dictionarySchema);
var counters = mongoose.model('counters', countersSchema);

function insertWord(wordInfo, groupId, callback) {
  counters.findOneAndUpdate( { _id: 'dictionary' }, { $inc: { seq: 1 } }, { new: true } ).exec( function(error, result) {
    if(error) {
      callback({isSuccessful: false, error: error});
    } else {
      dictionary.update({ courseId: wordInfo.courseId, word: wordInfo.word }, { $setOnInsert: { _id: result.seq, format: wordInfo.format, definition: wordInfo.definition, example: wordInfo.example, pronunciation: wordInfo.pronunciation, isLevelCreated: false, groupId: groupId, entryDate: new Date() } }, { upsert: true }).exec(function(error, success) {
        if(error) {
          callback({isSuccessful: false, error: error});
        } else {
          callback({isSuccessful: true, data: result});
        }
      });
    }
  });
}

function insertWordList(wordList, courseId, format, addWordsToDb, callback) {
  var index = 0;

  function insertRecursively(groupId) {
    if(index < wordList.length) {
      wordList[index].courseId = courseId;
      wordList[index].format = format;

      insertWord(wordList[index], groupId, function(result) {
        if(result.isSuccessful) {
          index++;
          insertRecursively(groupId);
        } else {
          callback(result);
        }
      });
    } else {
      callback({ isSuccessful: true });
    }
  }

  if(addWordsToDb) {
    insertRecursively(0);
  } else {
    counters.findOneAndUpdate( { _id: 'dictionary' }, { $inc: { seq: 1 } }, { new: true } ).exec( function(error, result) {
      if(error) {
        callback({isSuccessful: false, error: error});
      } else {
        insertRecursively(result.seq);
      }
    });
  }
}

function getWordList(courseId, callback) {
  dictionary.aggregate({ $match: { courseId: courseId, isLevelCreated: false } }, {$group: { _id : "$groupId",data: { $push: "$$ROOT" } }}, function(error, result) {
    if(error){
      callback({isSuccessful: false, error: error});
    } else {
      var data = null;
      for(var i = 0; i < result.length; i++) {
        if(result[i]._id == 0 && result[i].data.length >= wordListLimit) {
          result[i].data.splice(wordListLimit);
          data = result[i].data;
          break;
        } else if(result[i]._id > 0) {
          data = result[i].data;
          break;
        }
      }
      callback({isSuccessful: true, data: data});
    }
  });
}

function setWordListAsLevelCreated(wordList, callback) {
  var orCond = [];
  wordList.forEach(function(item, index) {
    orCond.push({ _id: item._id });
  });
  dictionary.where({ $or: orCond }).setOptions({ multi: true }).update({ isLevelCreated: true }).exec(function(error, result) {
    if(error) {
      callback({isSuccessful: false, error: error});
    } else {
      callback({isSuccessful: true, data: result});
    }
  });
}

function initialize() {
  mongoose.connect('mongodb://memvocadmin:4tR23%E7@ds057806.mlab.com:57806/memvoc');

  conn.on('error', console.error.bind(console, 'connection error:'));
  conn.on('open', function() {
    console.log('mongodb connection is successful');
  });
}

exports.initialize = initialize;
exports.insertWord = insertWord;
exports.insertWordList = insertWordList;
exports.getWordList = getWordList;
exports.setWordListAsLevelCreated = setWordListAsLevelCreated;
