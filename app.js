var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var app = express();

var recordings;

app.use(express.static('public'));

app.get('/add', function (req, res) {
  var record = req.query;
  recordings.insert(req.query, function(err, result) {
    res.status(err ? 500 : 200).end();
  })
});

app.get('/get', function (req, res) {
  recordings.find().toArray(function(err, items) {
    if(err) return res.status(500).end();
    res.json(items);
  });
});

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  if(err) { return console.dir(err); }
  console.log('Connected to database.');
  recordings = db.collection('recordings');

  var server = app.listen(process.env.PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://%s:%s', host, port);
  });
});
