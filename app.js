var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var rawCollection,
  dataCollection,
  sessionsCollection;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

io.on('connection', function (socket) {
  socket.emit('status', { server: __filename });
  socket.on('status', function (data) {
    console.log(data);
  });
});

function add(raw, res) {
  console.log(raw);
  var qcl_json_data = JSON.parse(raw.qcl_json_data);
  var data = {
    serial: raw.device_serial_number,
    time: raw.hub_receive_time + 'Z',
    spo2: qcl_json_data.records[0].spO2.value,
    hr: qcl_json_data.records[0].pulseRate.value
  }
  dataCollection.insert(data, function(err1, result) {
    rawCollection.insert(raw, function(err2, result) {
      res.sendStatus((err1 || err2) ? 500 : 200);
      io.sockets.emit('update', data);     
    })
  })
}

app.get('/add', function (req, res) {
  add(req.query, res);
});

app.post('/add', function (req, res) {
  add(req.body, res);
});

app.post('/add/session', function (req, res) {
  var data = req.body;
  sessionsCollection.insert(data, function(err, result) {
    res.sendStatus(err ? 500 : 200);
  });
});

app.get('/get/raw', function (req, res) {
  rawCollection.find().toArray(function(err, items) {
    if(err) return res.sendStatus(500);
    res.json(items);
  });
});

app.get('/get/sessions', function (req, res) {
  sessionsCollection.find().toArray(function(err, result) {
    if(err) return res.sendStatus(500);
    res.json(result);
  });
});

app.get('/get/data', function (req, res) {
  var limit = req.query.limit;
  var query = {};
  if(req.query.serial) {
    query.serial = req.query.serial;
  }
  var order = {'_id': -1};
  dataCollection.find(query)
    .sort(order)
    .toArray(function(err, items) {
    if(err) return res.sendStatus(500);
    if(limit) {
      items = items.slice(0, limit);
    }
    res.json(items);
  });
});

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  if(err) { return console.dir(err); }
  console.log('Connected to database.');
  rawCollection = db.collection('raw');
  dataCollection = db.collection('data');
  sessionsCollection = db.collection('sessions');

  server.listen(process.env.PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://%s:%s', host, port);
  });
});
