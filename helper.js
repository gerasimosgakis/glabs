const fs = require("fs");
const parser = require("xml2json");
const mongojs = require("mongojs");
const db = mongojs("myDatadb");
const collection1 = db.collection("debitItems");
const collection2 = db.collection("fullDoc");
const archiver = require("archiver");
const notifier = require("node-notifier");
const pathToDir = __dirname + "/xml-files"; // Path to the directory with the xml files

/**
 * Read given directory and return array with the names
 */
const readDir = function(pathDir) {
  const fileNames = []; // Creare array for the file names
  if (!fs.existsSync(pathToDir)){ // If there is no directory with the given name, it will be created
    fs.mkdirSync(pathToDir);
  }
  return new Promise((resolve, reject) => {
    fs.readdir(pathDir, (err, items) => { // Reads in directory directory
      if (err) {
        reject(err);
      }
      items.map((item) => { // Iterates through the files in the directory
        if (item.endsWith(".xml") || item.endsWith(".txt")) { // the files ending with xml or txt
          fileNames.push(item); // are pushed in the array fileNames
        }
      });
    resolve(fileNames);
    });
 
  });
}

/**
 * Read in the files and return array with the contents
 */
const readFiles = function(files) { 
  return new Promise(resolve => {
    const contents = [];
    files.map(file => {
      contents.push(fs.readFileSync(pathToDir+"/"+file).toString());
    });
    resolve(contents);
  });
}

/**
 * Using the array with the data parse the documents, convert them to json and
   and insert the full doc as well as the ReturnedDebitItem in the fullDoc and debitItems collections respectively
 */
const parseImportToDb = function(dataArray) {
  return new Promise((resolve, reject) => {
    dataArray.map(data => {
      let json = JSON.parse(parseXML(data));
      const records = json.BACSDocument.Data.ARUDD.Advice.OriginatingAccountRecords; // This is the node the ReturnedDebitItem is child of
      Object.keys(records).forEach(record => { // Iterates in the Object
        db.debitItems.insert(records[record].ReturnedDebitItem, (err, doc) => { // Inserts the ReturnedDebitItem objects in the debitItems collection
          if (err) {
            reject(err);
          }
        });
      });

      db.fullDoc.insert(json, (err, doc) => { // Inserts the full socuument in the fullDoc collection
        if (err) {
          reject(err);
        }
      });
      resolve('Imported to db');
    });
  });
}

/**
 * Parse XML files and convert them to JSON
 */
const parseXML = function(data) {
  const options = {
    alternateTextNode: true // Added this option so it converts "$" to "_". It helps for importing in mongoDB
  }
  return parser.toJson(data, options);
}

/**
 * Archive files after they have been inserted in the db
 */
const archiveFiles = function(files) {
  return new Promise((resolve, reject) => {
  const dir = pathToDir + "/backups";
  if (!fs.existsSync(dir)){ // If backups dir doesn't exist, we create it
    fs.mkdirSync(dir);
  }
  const output = fs.createWriteStream(pathToDir + "/backups/backup" + Date.now() + ".zip"); // Creates the folder and opens the stream to write in
  const archive = archiver("zip", { // The archiver lib compresses the file using zip
    zlib: {
      level: 9
    } // Sets the compression level
  });

  output.on("close", function() { // When the output stream closes we close the connection with the database and resolve the promise
    console.log(archive.pointer() + " total bytes");
    console.log("archiver has been finalized and the output file descriptor has closed.");
    db.close();
    resolve('Archiving is done');
  });

  archive.pipe(output);

  const getStream = function(fileName) {
    return fs.readFileSync(fileName);
  }

    files.map(file => {
      let path = pathToDir + "/" + file;
      archive.append(getStream(path), {
        name: file
      });
    });
    archive.finalize();
  });
  resolve('Files have been archived');
} 

/**
 * Delete files after they have been archived
 */
const deleteFiles = function(files) {
 return new Promise((resolve, reject) => {
   for (const file of files) {

     fs.unlink(pathToDir + "/" + file, err => {
      if (err) {
       reject(err);
      }
     });

   }
   resolve("All xml files Deleted");
  });
}

/**
 * Send notification after everything has been completed
 */
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

/**
 * Main function. Here all the promises are called
 */
exports.main = function() {
  let filesNames = [];
  readDir(pathToDir)
    .then(res => {
      fileNames = res;
    })
    .then(() => {
      console.log(fileNames);
      readFiles(fileNames)
        .then(parseImportToDb)
        .then(() => {
          archiveFiles(fileNames);
        })
        .then(() => {
          deleteFiles(fileNames);
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
