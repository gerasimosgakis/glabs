const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/';

const resultArr = [];

//Connects to mongDB and stores the docs in the array resultArr
const mongoConnect = function() {
  MongoClient.connect(url, (err, db) => {
    if(err) throw err;
    var dbo = db.db("finaldb");
    var cursor = dbo.collection('debitItems').find();
    cursor.forEach((doc, err) => {
      if (resultArr.indexOf(doc) === -1) {
        resultArr.push(doc);
        console.log(resultArr);
      }
    });
  });
}

mongoConnect();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('glabs-ui', { json: resultArr }); // render the page glabs-ui.pug and send the data we have stored in resultArr
});

module.exports = router;
