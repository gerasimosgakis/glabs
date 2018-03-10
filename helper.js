var fs = require('fs');
var mongojs = require('mongojs');
var db = mongojs('mydb2', ['newtest5']);
var db2 = mongojs('mydb2', ['debitItems']);
var parser = require('xml2json');
var archiver = require('archiver');
var JSZip = require("jszip");
/*if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/directory");
    process.exit(-1);
}*/
 
var path2 = '/home/gerasimos/Documents/financial-cloud-test/third-attempt/files3';


exports.test = function() {
	return fs.readdir(path2, (err, items) => { 
	    for (let i=0; i<items.length; i++) {
	        console.log(items[i]);
	        fs.readFile(path2+'/'+items[i], 'utf8', (err, contents) => {
	        	//console.log(parseXML(contents)["BACSDocument"]);
	        	parseImportToDb(parseXML(contents));
	        	if (i === items.length-1) {
	        		console.log('The End');
	        	}
	        })
	    }
	});
}

parseImportToDb = function(data) {
	var json = JSON.parse(data);
	//console.log(json.BACSDocument.Data.ARUDD.Advice.OriginatingAccountRecords);
	var records = json.BACSDocument.Data.ARUDD.Advice.OriginatingAccountRecords;
	console.log(typeof records);
	for (let record in records) {
		console.log(records[record].ReturnedDebitItem);
		db2.debitItems.insert(records[record].ReturnedDebitItem, (err, doc) => {
			console.log('Imported ReturnedDebitItem');
			db2.close();
			if(err) throw err;
		})
	}

	return db.newtest5.insert(json, (err, doc) => {
		console.log('Imported Full Document');
		db.close();
		if(err) throw err;
	});
}

parseXML = function(data) {
	var options = {
		alternateTextNode: true
	}
	return parser.toJson(data, options);
}

//test();
//archiveFiles();

