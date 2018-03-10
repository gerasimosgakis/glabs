var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/';


//var URL = 'mongodb://localhost:27017/mydb2'

// Use connect method to connect to the Server

//var resultDebit;
var resultArr = [];

const mongoConnect = function() {
  MongoClient.connect(url, function(err, db) {
    if(err) throw err;
    var dbo = db.db("finaldb");
    var cursor = dbo.collection('debitItems').find();
    cursor.forEach((doc, err) => {
      if (resultArr.indexOf(doc) === -1) {
        resultArr.push(doc);
        console.log(resultArr);
      }
    }, () => {
      //db.close();
      console.log(resultArr);
      return;
    })

  });
}

mongoConnect();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('glabs-ui', { json: resultArr });
  //res.json(resultArr);
});

module.exports = router;
