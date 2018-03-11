const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/';

const debitArr = [];

/**
 * Connect to mongoDB database, and cursor into the debitItems collection storing the data in an array
 */
const mongoConnect = function() {
  MongoClient.connect(url, (err, db) => {
    if(err) throw err;
    var dbo = db.db("myDatadb");
    var cursor = dbo.collection('debitItems').find();
    cursor.forEach((doc, err) => {
      if (debitArr.indexOf(doc) === -1) {
        debitArr.push(doc);
      }
    });
  });
}

mongoConnect();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('myData-ui', { json: debitArr }); // render the page glabs-ui.pug and send the data we have stored in resultArr
});

module.exports = router;
