/* TRYING TO FIGURE OUT WHAT GIT IS DOING
 * Authors: Gianna Macri, Mario Natalino
 * Project: Backpack
 * Last updated: 2015 November 19
 */

// Declarations:
// Express for http server, 
// fs and sqlite3 for storing and manipulating data on server

var express = require('express');
var app = express();

var fs = require("fs");
var file = "users.db";
var exists = fs.existsSync(file);

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

// Creates users database if there isn't one 
if(!exists){
  console.log("Could not find users database: creating a new one");
  fs.openSync(file, "w");
}

// For parsing POST request bodies
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Declaring location of static files 
app.use(express.static('static_files'));

// REQUESTS TO /LOGIN
// Create a new user
app.post('/login', function (req, res) {
  var postBody = req.body;
  var myName = postBody.username;
  var myPassword = postBody.password;

  // Require username and password 
  if (!myName | !myPassword) {
    res.send('ERROR');
    return; 
  }

  // Check if user's name is already in database; if so, send an error
  db.get('SELECT * FROM users WHERE username = \'' + myName+'\'', function(err, row){
   if(!(row===undefined)){
    res.send('ERROR'); 
    return; // return early!
    }
   });


  // otherwise add the user to the database by pushing (appending)
  // postBody to the fakeDatabase list
  db.run('INSERT INTO users (username,password) VALUES (\''+myName+'\',\''+myPassword+'\')');

  res.send('OK');
});
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

app.post('/??????????????????????///', function (req, res) {




});

/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////


// Read a user (log in to existing user)
app.get('/login/*', function (req, res) {
  // Start by parsing login info from parameters
  var userToLookup = req.params[0].split("&"); 
  var nameToLookup = userToLookup[0];
  var passToLookup = userToLookup[1];
  console.log(nameToLookup);
  console.log(passToLookup);

  // If user is a match in database, return the user's data.
  db.get('SELECT * FROM users WHERE username = \'' + nameToLookup+'\' AND password =  \''+ passToLookup + '\'', function(err, row){
   if(row===undefined){
      res.send('{}');
    } else {
      res.send('{"username":"'+row.username+'", "password":"'+row.password+'"}'); 

    }
   });
});

// Read profile data for a user
app.get('/users/*', function (req, res) {
  var nameToLookup = req.params[0]; // this matches the '*' part of '/users/*' above
  var passToLookup = req.params[1];
  db.get('SELECT * FROM users WHERE username = \'' + nameToLookup+'\'', function(err, row){
   if(row===undefined){
      res.send('{}');
    } else {
      res.send('{"username":"'+row.username+'", "password":"'+row.password+'"}'); 
    }
   });
  //res.send('{}'); // failed, so return an empty JSON object!
});



/*
// UPDATE a user's profile with the data given in POST
//
// To test with curl, run:
//   curl -X PUT --data "job=bear_wrangler&pet=bear.jpg" http://localhost:3000/users/Philip
app.put('/users/*', function (req, res) {
  var nameToLookup = req.params[0]; // this matches the '*' part of '/users/*' above
  // try to look up in fakeDatabase
  for (var i = 0; i < fakeDatabase.length; i++) {
    var e = fakeDatabase[i];
    if (e.name == nameToLookup) {
      // update all key/value pairs in e with data from the post body
      var postBody = req.body;
      for (key in postBody) {
        var value = postBody[key];
        e[key] = value;
      }

      res.send('OK');
      return; // return early!
    }
  }

  res.send('ERROR'); // nobody in the database matches nameToLookup
});


// DELETE a user
//
// To test with curl, run:
//   curl -X DELETE http://localhost:3000/users/Philip
//   curl -X DELETE http://localhost:3000/users/Jane
app.delete('/users/*', function (req, res) {
  var nameToLookup = req.params[0]; // this matches the '*' part of '/users/*' above
  // try to look up in fakeDatabase
  for (var i = 0; i < fakeDatabase.length; i++) {
    var e = fakeDatabase[i];
    if (e.name == nameToLookup) {
      fakeDatabase.splice(i, 1); // remove current element at index i
      res.send('OK');
      return; // return early!
    }
  }

  res.send('ERROR'); // nobody in the database matches nameToLookup
});

*/
// start the server on http://localhost:3000/
var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Server started at http://localhost:%s/', port);
});
