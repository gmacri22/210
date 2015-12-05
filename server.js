var express = require('express');
var app = express();

var fs = require("fs");
var file = "users.db";
var exists = fs.existsSync(file);

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

if(!exists){
  console.log("creating db file");
  fs.openSync(file, "w");
}

// required to support parsing of POST request bodies
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// put all of your static files (e.g., HTML, CSS, JS, JPG) in the static_files/
// sub-directory, and the server will serve them from there. e.g.,:
//
// http://localhost:3000/fakebook.html
// http://localhost:3000/cat.jpg
//
// will send the file static_files/cat.jpg to the user's Web browser
app.use(express.static('static_files'));

// CREATE a new user

app.post('/login', function (req, res) {
  var postBody = req.body;
  var myName = postBody.username;
  var myPassword = postBody.password;

  // must have a name!
  if (!myName) {
    res.send('ERROR');
    return; // return early!
  }

  // check if user's name is already in database; if so, send an error
  db.get('SELECT * FROM users WHERE username = \'' + myName+'\'', function(err, row){
   if(!(row===undefined)){
    res.send('ERROR'); 
    return; // return early!
    }
   });

  //var mkdirp = require('mkdirp');
  fs.mkdirSync('static_files/users/'+myName+'/');

  var usr = "static_files/users/"+myName+"/posts.db";
  var fd = fs.openSync(usr, "w");
  fs.closeSync(fd);
  

  var usrdb = new sqlite3.Database(usr);
  usrdb.run('CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, body text) ');
  usrdb.close();
  
  db.run('INSERT INTO users (username,password) VALUES (\''+myName+'\',\''+myPassword+'\')');

  res.send('OK');
});

app.post('/backpack.html', function (req, res) {
  var postbody = req.body;
  var title = postbody.title;
  var link = postbody.link;
  var body = postbody.body;
  var username = postbody.secretUsername;
  console.log('Adding something to database');
  var usrdb = new sqlite3.Database('static_files/users/'+username+'/posts.db');
  usrdb.run('INSERT INTO posts (title, body) VALUES (\'<a href="'+link+'">'+title+'</a>\', \''+body+'\')');
  usrdb.all('SELECT * FROM posts', function(err, rows){
      var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
          table = table.concat("<tr> <td>" + rows[i].title + "</td> <td>"+rows[i].body+"</td>"); 
table = table.concat("<td><button value = "+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
      }
      table = table.concat("</table>");
      res.send(table);
  });
  
  usrdb.close();
  
});

app.get('/backpack.html/*', function(req, res) { 
  var username = req.params[0];
 
  var usrdb = new sqlite3.Database('static_files/users/'+username+'/posts.db');
  usrdb.all('SELECT * FROM posts', function(err, rows){
      var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
          table = table.concat("<tr> <td>" + rows[i].title + "</td> <td>"+rows[i].body+"</td>"); 
table = table.concat("<td><button value = "+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
      }
      table = table.concat("</table>");
      res.send(table);
  });
  
  usrdb.close();

});

app.delete('/backpack.html', function (req, res) {
  var idToDelete = req.body.id;
  var username = req.body.username;
  var usrdb = new sqlite3.Database('static_files/users/'+username+'/posts.db');
  console.log("DELETING "+idToDelete);
  usrdb.run('DELETE FROM posts WHERE id = ' + idToDelete);
  usrdb.all('SELECT * FROM posts', function(err, rows){
      var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
          table = table.concat("<tr> <td>" + rows[i].title + "</td> <td>"+rows[i].body+"</td>"); 
table = table.concat("<td><button value = "+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
      }
      table = table.concat("</table>");
      console.log("send a print");
      res.send(table);
  });

 usrdb.close();
});


// READ profile data for a user

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

app.get('/login/*', function (req, res) {
  var userToLookup = req.params[0].split("&"); 
  var nameToLookup = userToLookup[0];
  var passToLookup = userToLookup[1];
  db.get('SELECT * FROM users WHERE username = \'' + nameToLookup+'\' AND password =  \''+ passToLookup + '\'', function(err, row){
   if(row===undefined){
      res.send('{}');
    } else {
      res.send('{"username":"'+row.username+'", "password":"'+row.password+'"}'); 
    }
   });
  //res.send('{}'); // failed, so return an empty JSON object!
});


// DELETE a user

app.delete('/users/*', function (req, res) {
  var nameToLookup = req.params[0];

  db.run('DELETE FROM users WHERE username = \'' + nameToLookup+'\'', function(err, row){

   });

  res.send('OK');
});


app.put('/login/*', function (req, res) {
  var userToLookup = req.params[0].split("&"); 
  var nameToLookup = userToLookup[0];
  var newPassword = userToLookup[1];
  console.log(nameToLookup);
  console.log(newPassword);
  db.run('UPDATE users SET password = \''+newPassword+'\' WHERE username = \'' + nameToLookup+'\'', function(err, row){

   });
  res.send('OK');
});



// start the server on http://localhost:3000/
var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Server started at http://localhost:%s/', port);
});











