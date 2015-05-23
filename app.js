var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var rawCollection, dataCollection;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

io.on('connection', function (socket) {
  socket.emit('status', { server: __filename });
  socket.on('status', function (data) {
    console.log(data);
  });
});

function add(raw, res) {
  console.log(raw);
  var data = {
    serial: raw.device_serial_number,
    time: raw.hub_receive_time,
    spo2: raw.qcl_json_data.records[0].spO2.value,
    hr: raw.qcl_json_data.records[0].pulseRate.value
  }
  dataCollection.insert(data, function(err1, result) {
    rawCollection.insert(raw, function(err2, result) {
      res.sendStatus((err1 || err2) ? 500 : 200);
      io.sockets.emit('update', obj);     
    })
  })
}

app.get('/add', function (req, res) {
  add(req.query, res);
});

app.post('/add', function (req, res) {
  add(req.body, res);
});

app.get('/get/raw', function (req, res) {
  rawCollection.find().toArray(function(err, items) {
    if(err) return res.sendStatus(500);
    res.json(items);
  });
});

app.get('/get/data', function (req, res) {
  dataCollection.find().toArray(function(err, items) {
    if(err) return res.sendStatus(500);
    res.json(items);
  });
});

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  if(err) { return console.dir(err); }
  console.log('Connected to database.');
  rawCollection = db.collection('raw');
  dataCollection = db.collection('data');

  server.listen(process.env.PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://%s:%s', host, port);
  });
});
