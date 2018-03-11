const fs = require('fs');
const parser = require("xml2json");
const mongojs = require("mongojs");
const db = mongojs("myDatadb");
const collection1 = db.collection("debitItems");
const collection2 = db.collection("fullDoc");
const archiver = require("archiver");
const pathToDir = __dirname + "/xml-files"; // Path to the directory with the xml files
const notifier = require("node-notifier")

const readDir = function(pathDir) {
  const fileNames = [];
  if (!fs.existsSync(pathToDir)){
    fs.mkdirSync(pathToDir);
  }
  return new Promise((resolve, reject) => { //promise
    fs.readdir(pathDir, (err, items) => { //reads in directory directory
      if (err) {
        reject(err);
      }
      items.map((item) => {
        if (item.endsWith(".xml") || item.endsWith(".txt")) {
          fileNames.push(item);
        }
      });
    resolve(fileNames);
    });
 
  });
}

const readFiles = function(files) { 
  return new Promise((resolve) => {
    const contents = [];
    files.map((file) => {
      contents.push(fs.readFileSync(pathToDir+"/"+file).toString());
    });
    resolve(contents);
  });
}


// Parses data from file, converts them to json and imports to db
const parseImportToDb = function(dataArray) {
  return new Promise((resolve, reject) => {
    dataArray.map((data) => {
      let json = JSON.parse(parseXML(data));
      const records = json.BACSDocument.Data.ARUDD.Advice.OriginatingAccountRecords; // This is the node the ReturnedDebitItem is child of
      Object.keys(records).forEach((record) => {
        db.debitItems.insert(records[record].ReturnedDebitItem, (err, doc) => {
          if (err) {
            reject(err);
          }
        });
      });

      db.fullDoc.insert(json, (err, doc) => {
        if (err) {
          reject(err);
        }
      });
      resolve('Imported to db');
    });
  });
}


const parseXML = function(data) {
 const options = {
  alternateTextNode: true // Added this option so it converts "$" to "_". It helps for importing in mongoDB
 }
 return parser.toJson(data, options);
}


const archiveFiles = function(files) {
  return new Promise((resolve, reject) => {
  const dir = pathToDir + "/backups";
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  const output = fs.createWriteStream(pathToDir + "/backups/backup" + Date.now() + ".zip"); // Creates the folder and opens the stream to write in
  const archive = archiver("zip", { // The archiver lib compresses the file using zip
    zlib: {
      level: 9
    } // Sets the compression level
  });

  output.on("close", function() { // When the output stream closes we close the connection with the database
    console.log(archive.pointer() + " total bytes");
    console.log("archiver has been finalized and the output file descriptor has closed.");
    db.close();
    resolve('Archiving is done');
  });

  archive.pipe(output);

  const getStream = function(fileName) {
    return fs.readFileSync(fileName);
  }

    files.map((file) => {
      let path = pathToDir + "/" + file;
      archive.append(getStream(path), {
        name: file
      });
    });
    archive.finalize();
  });
  resolve('Files have been archived');
} 

const deleteFiles = function(files) {
 return new Promise((resolve, reject) => {
   for (const file of files) { //Iterates in the directory

     fs.unlink(pathToDir + "/" + file, err => { // Deletes files ending in .txt or .xml
      if (err) {
       reject(err);
      }
     });

   }
   resolve("All xml files Deleted");
  });
}

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

 /*Create a promise that reads the files in the dir and if they end in .txt or .xml 
 they are stored in an array. After this ihas been completed, we append them in the zip folder.
 After this has been complted too we call deleteFiles to delete the xml files*/

exports.main = function() {
  let array = [];
  readDir(pathToDir)
    .then(res => {
      array = res;
    })
    .then(() => {
      console.log(array);
      readFiles(array)
        .then(parseImportToDb)
        .then(() => {
          archiveFiles(array);
        })
        .then(() => {
          deleteFiles(array);
        })
        .catch(err => {
          throw new Error(err);
        })
    })
    .then(notify)
    .catch(err => {
      throw new Error(err);
    })
}
