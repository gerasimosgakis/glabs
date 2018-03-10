# myGlabs

A Node js application

## Description

### INTRODUCTION
Glabs receive a set of files daily from a bank that contain a structured XML schema (example of one is attached). These files are manually read and then hand posted to the core lending platform. 

### Functionality
1) Reads the directory
2) Parses each XML file in the directory, transforming each one from XML to JSON
3) Store the full JSON document in mongoDB 
4) Reads each JSON object document extracting all the <ReturnedDebitItem> objects and storing into the database
5) Triggers a notification to indicate the files have been successfully parsed and key data extracted
6) Performs backups of the proocessed files and then deletes the original
7) Simple UI to read the extracted data (the ReturnedDebitItems)

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and [MongoDB](https://www.mongodb.com/download-center) installed.

```sh
git clone https://github.com/gerasimosgakis/glabs.git # or clone your own fork
cd myGlabs
npm install
npm start
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

Please visit [Sample page](http://ec2-18-218-172-187.us-east-2.compute.amazonaws.com:3000/) for an example.
