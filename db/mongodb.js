var mongoose = require('mongoose');
var conn = mongoose.connection;

function initialize() {
  mongoose.connect('mongodb://memvocadmin:4tR23%E7@ds057806.mlab.com:57806/memvoc');

  conn.on('error', console.error.bind(console, 'connection error:'));
  conn.on('open', function() {
    console.log('mongodb connection is successful');
  });
}

exports.initialize = initialize;
