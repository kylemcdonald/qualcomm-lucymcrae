var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var express = require('express');
var app = express();

var data;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function add(obj, res) {
  console.log(obj);
  data.insert(obj, function(err, result) {
    res.sendStatus(err ? 500 : 200);
  })
}

app.get('/add', function (req, res) {
  add(req.query, res);
});

app.post('/add', function (req, res) {
  add(req.body, res);
});

app.get('/get', function (req, res) {
  data.find().toArray(function(err, items) {
    if(err) return res.sendStatus(500);
    res.json(items);
  });
});

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  if(err) { return console.dir(err); }
  console.log('Connected to database.');
  data = db.collection('data');

  var server = app.listen(process.env.PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://%s:%s', host, port);
  });
});
