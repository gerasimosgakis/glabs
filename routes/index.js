var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/';


//var URL = 'mongodb://localhost:27017/mydb2'

// Use connect method to connect to the Server

var resultDebit;
var resultArr = [];

MongoClient.connect(url, function(err, db) {
  if(err) throw err;
  var dbo = db.db("finaldb");
  /*dbo.collection("debitItems").findOne({}, function(err, result) {
  	if (err) throw err;
  	resultDebit = result._id;
  	console.log(result);
  	db.close();
  });*/
  var cursor = dbo.collection('debitItems').find();
  cursor.forEach((doc, err) => {
  	resultArr.push(doc);
  }, () => {
  	//db.close();
  	console.log(resultArr);
  	return;
  })

});

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: resultDebit });
  res.render('glabs-ui', { json: resultArr });

  //res.json(resultArr);
});

module.exports = router;
