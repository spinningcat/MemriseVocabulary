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
  entryDate: { type: Date, default: Date.now }
});

var countersSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number }
});

var dictionary = mongoose.model('dictionary', dictionarySchema);
var counters = mongoose.model('counters', countersSchema);

function insertWord(wordInfo, callback) {
  counters.findOneAndUpdate( { _id: 'dictionary' }, { $inc: { seq: 1 } }, { new: true } ).exec( function(error, result) {
    if(error) {
      callback({isSuccessful: false, error: error});
    } else {
      dictionary.update({ courseId: wordInfo.courseId, word: wordInfo.word }, { $setOnInsert: { _id: result.seq, format: wordInfo.format, definition: wordInfo.definition, example: wordInfo.example, pronunciation: wordInfo.pronunciation, isLevelCreated: false, entryDate: new Date() } }, { upsert: true }).exec(function(error, success) {
        if(error) {
          callback({isSuccessful: false, error: error});
        } else {
          callback({isSuccessful: true, data: result});
        }
      });
    }
  });
}

function insertWordList(wordList, courseId, format, callback) {
  var index = 0;

  function insertRecursively() {
    if(index < wordList.length) {
      wordList[index].courseId = courseId;
      wordList[index].format = format;

      insertWord(wordList[index], function(result) {
        if(result.isSuccessful) {
          index++;
          insertRecursively();
        } else {
          callback(result);
        }
      });
    } else {
      callback({ isSuccessful: true });
    }
  }

  insertRecursively();
}

function getWordList(courseId, callback) {
  dictionary.find({ courseId: courseId, isLevelCreated: false }).sort({_id: 'asc'}).limit(wordListLimit).exec(function(error, result) {
    if(error){
      callback({isSuccessful: false, error: error});
    } else {
      callback({isSuccessful: true, data: result, limit: wordListLimit});
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
