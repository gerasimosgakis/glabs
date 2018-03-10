const fs = require('fs');
const parser = require('xml2json');
const mongojs = require('mongojs');
const db = mongojs('finaldb');
const collection1 = db.collection('debitItems');
const collection2 = db.collection('fullDoc');
const notifier = require('node-notifier');
const archiver = require('archiver');
const path = require('path');
const pathToDir = __dirname + '/xml-files'; // Path to the directory with the xml files
var resultDebit;
var resultArr = [];
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/';
// Reads files in given directory and adds data to db
const addDataToDb = function(pathDir) {
	return new Promise((resolve, reject) => { //promise
		fs.readdir(pathDir, (err, items) => { //reads in directory directory
		  for (let item of items) { //iterates in the list of files
	      if (item.endsWith('.txt') || (item.endsWith('.xml'))) { // works only with txt and xml files
		      fs.readFile(pathDir + '/' + item, 'utf8', (err, contents) => { // reads file
	        	parseImportToDb(parseXML(contents)); //Call function to import data to db
		      })
	    	}

			}
			if (err) {
				reject(err);
			}
			resolve('All parsed');
		})
	})
}

// Parses data from file, converts them to json and imports to db
const parseImportToDb = function(data) {
	new Promise((resolve, reject) => {
		const json = JSON.parse(data); // convert String into an object
		const records = json.BACSDocument.Data.ARUDD.Advice.OriginatingAccountRecords; // This is the node the ReturnedDebitItem is child of
		for (let record in records) { //Iterating in the keys 
			db.debitItems.insert(records[record].ReturnedDebitItem, (err, doc) => { // Inserts the ReturnedDebitItems in a new collection in mongoDB
				if(err) {
					console.log('Error', err);
				}
			})
		}

		db.fullDoc.insert(json, (err, doc) => { //Stores the full json document in a new collection
			if(err) {
				console.log('Error', err);
			}
		});
		resolve('Imported to db');
	}).then((results) => {
		console.log(results);
	});
}


//Method for converting XML to JSON format
const parseXML = function(data) {
	const options = {
		alternateTextNode: true // Added this option so it converts '$' to '_'. It helps for importing in mongoDB
	}
	return parser.toJson(data, options);
}

// Creates a zip folder and stores files into it after compressing
const archive = function(pathDir) {
	const output = fs.createWriteStream(pathDir + '/backup'+Date.now()+'.zip'); // Creates the folder and opens the stream to write in
	const archive = archiver('zip', { // The archiver lib compresses the file using zip
		zlib: { level: 9 } // Sets the compression level
	})

	output.on('close', function() { // When the output stream closes we close the connection with the database
	  console.log(archive.pointer() + ' total bytes');
	  console.log('archiver has been finalized and the output file descriptor has closed.');
	  //db.close();
	});
	archive.pipe(output);

	const getStream = function(fileName) {
		return fs.readFileSync(fileName);
	}

	/*Create a promise that reads the files in the dir and if they end in .txt or .xml 
	they are stored in an array. After this ihas been completed, we append them in the zip folder.
	After this has been complted too we call deleteFiles to delete the xml files*/
	return new Promise((resolve, reject) => {
		fs.readdir(pathDir, (err, items) => {
			if (err) {
				console.log('Error:', err);
			}
			const filesToZip = [];
			for (let item of items) {
				if (item.endsWith('.xml') || item.endsWith('.txt')) {
					filesToZip.push(item);
				}
			}
			resolve(filesToZip);
		});
	}).then((files) => {
		console.log(files);
		for (let file of files) {
			let path = pathDir + '/' + file;
			archive.append(getStream(path), {name: file});
		}
		archive.finalize();
	}).then(deleteFiles(pathDir));

}

// Delete the files that have been processed
const deleteFiles = function(pathDir) {
	new Promise((resolve, reject) => {
		fs.readdir(pathDir, (err, files) => {
			if (err) throw err;

			for (const file of files) { //Iterates in the directory
				if (file.endsWith('.txt')){
					fs.unlink(path.join(pathDir, file), err => { // Deletes files ending in .txt or .xml
						if (err) {
							console.log('Error', err);
						}
					});
				}
			}
			resolve('All xml files Deleted');
		});
	});

}

// sends notification once the import has been completed
const notify = function() {
		notifier.notify({
		  'title': 'XML backup',
		  'subtitle': 'Daily Maintenance',
		  'message': 'Check what\'s new!',
		  'icon': 'dwb-logo.png',
		  'contentImage': 'blog.png',
		  'sound': 'ding.mp3',
		  'wait': true
		});
}

//Main function - Runs the main process
exports.main = function() {
	console.log(__dirname);
	  addDataToDb(pathToDir)
	  .then((results) => {
	  	console.log(results);
	  	archive(pathToDir).then((res) => {
	  		console.log('the end');
	  		notify();
	  	});
	  });
}


exports.mongoConnect = function() {
  MongoClient.connect(url, function(err, db) {
    if(err) throw err;
    var dbo = db.db("finaldb");
    var cursor = dbo.collection('debitItems').find();
    cursor.forEach((doc, err) => {
      resultArr.push(doc);
    }, () => {
      //db.close();
      console.log(resultArr);
      return;
    })

  });
}