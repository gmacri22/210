/*
 * Gianna Macri, Mario Natalino
 * Backpack server code
 */

// Declarations

// For http server and routing
var express = require('express');
var app = express();

// For file i/o, making sure user database exists

var fs = require("fs");
var file = "users.db";
var exists = fs.existsSync(file);


// For managing databases, namely users.db

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);
if(!exists){
  console.log("creating db file");
  fs.openSync(file, "w");
}

// For parsing of POST request bodies
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Location of static files
app.use(express.static('static_files'));


app.get('/people', function (req, res) {
  db.all('SELECT * FROM users', function(err, rows){
      var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
        table = table.concat("<tr><td><a href=\"userpage.html?name="+rows[i].username+"\">" + rows[i].username + "</a></td></tr>");
      }
      table = table.concat("</table>");
	  res.send(table);
  });

});


app.get('/userpage*', function (req, res) {
  var usrdb = new sqlite3.Database('static_files/users/'+req.query.name	+'/posts.db');

usrdb.all('SELECT * FROM posts', function(err, rows){
	  var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
table = table.concat("<tr> <td id=title"+rows[i].id+">" 
	+rows[i].title+"</td><td id=link"+rows[i].id+">"
	+rows[i].link+"</td><td id=desc"+rows[i].id+">"
	+rows[i].body+"</td>"); 
      }
      table = table.concat("</table>");
	  res.send(table);
  });
  usrdb.close();



});
/************************REQUESTS TO LOGIN************************/

// GET - Read - Login
app.get('/login/*', function (req, res) {
  var nameToLookup = req.query.username;
  var passToLookup = req.query.password;
  db.get('SELECT * FROM users WHERE username = ? AND password =  ?', 
	[nameToLookup,passToLookup], function(err, row){
   if(row===undefined){
      res.send('{}');
    } else {
      res.send('{"username":"'+row.username+'", "password":"'+row.password+'"}'); 
    }
   });
});

// POST - Create - Create account
app.post('/login', function (req, res) {
  var myName = req.body.username;
  var myPassword = req.body.password;

  // must have a name!
  if (!myName) {
    res.send('ERROR');
    return; // return early!
  }

  // check if user's name is already in database; if so, send an error
  db.get('SELECT * FROM users WHERE username = ?', myName, function(err, row){
   if(!(row===undefined)){
    res.send('ERROR'); 
    return;
    }
   });

  // Otherwise, make a posts database an entry in users database 
  fs.mkdirSync('static_files/users/'+myName+'/');

  var usr = "static_files/users/"+myName+"/posts.db";
  var fd = fs.openSync(usr, "w");
  fs.closeSync(fd);
  

  var usrdb = new sqlite3.Database(usr);
  usrdb.run('CREATE TABLE posts (id INTEGER PRIMARY KEY, category TEXT, title TEXT, link TEXT, body text) ');
  usrdb.close();
  
  db.run('INSERT INTO users (username,password) VALUES (?,?)',
	[myName,myPassword]);

  res.send('OK');
});

app.put('/login/*', function (req, res) {
  var userToLookup = req.params[0].split("&"); 
  var nameToLookup = userToLookup[0];
  var newPassword = userToLookup[1];
  console.log(nameToLookup);
  console.log(newPassword);
  db.run("UPDATE users SET password = ? WHERE username = ?",[newPassword,nameToLookup]);
  res.send('OK');
});

/************************REQUESTS TO BACKPACK************************/

app.get('/backpack.html/*', function(req, res) {
  var usrdb = new sqlite3.Database('static_files/users/'+req.query.username+'/posts.db');
  usrdb.all('SELECT * FROM posts', function(err, rows){
	  var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
table = table.concat("<tr> <td id = cat"+rows[i].id+" contenteditable\"false\">"
	+rows[i].category+"</td><td id=title"+rows[i].id+" contenteditable=\"false\">" 
	+rows[i].title+"</td><td id=link"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].link+"</td><td id=desc"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].body+"</td>"); 
table = table.concat("<td><button id = editbtn"+rows[i].id+" value = "
	+rows[i].id+" type=\"button\" class=\"btn edit\"> Edit </button></td>");
table = table.concat("<td><button value = "
	+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
      }
      table = table.concat("</table>");
	  res.send(table);
  });
  usrdb.close();
});

app.post('/backpack.html', function (req, res) {
  var postbody = req.body;
  var cat = req.body.category;
  var title = postbody.title;
  var link = postbody.link;
  var body = postbody.body;
  var username = postbody.secretUsername;
  console.log('Adding something to database');
  var usrdb = new sqlite3.Database('static_files/users/'+username+'/posts.db');
  usrdb.run("INSERT INTO posts (category, title, link, body) VALUES (?, ?, ?, ?)", [cat, title, link, body]);
  usrdb.all('SELECT * FROM posts', function(err, rows){
	  var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
table = table.concat("<tr> <td id = cat"+rows[i].id+" contenteditable\"false\">"
	+rows[i].category+"</td><td id=title"+rows[i].id+" contenteditable=\"false\">" 
	+rows[i].title+"</td><td id=link"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].link+"</td><td id=desc"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].body+"</td>"); 
table = table.concat("<td><button id = editbtn"+rows[i].id+" value = "
	+rows[i].id+" type=\"button\" class=\"btn edit\"> Edit </button></td>");
table = table.concat("<td><button value = "
	+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
      }
      table = table.concat("</table>");
	  res.send(table);
  });
  usrdb.close();
});

app.put('/backpack.html/', function(req, res) {
    var usrdb = new sqlite3.Database('static_files/users/'+req.body.username+'/posts.db');
    usrdb.run("UPDATE posts SET category = ?, title = ?, link = ?, body = ? WHERE id = ?",
		[req.body.category, req.body.title, req.body.link, req.body.desc, req.body.id]); 
  usrdb.all('SELECT * FROM posts', function(err, rows){
	  var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
table = table.concat("<tr> <td id = cat"+rows[i].id+">"+rows[i].category+"</td><td id=title"
	+rows[i].id+" contenteditable=\"false\">" 
	+rows[i].title+"</td><td id=link"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].link+"</td><td id=desc"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].body+"</td>"); 
table = table.concat("<td><button id = editbtn"+rows[i].id+" value = "
	+rows[i].id+" type=\"button\" class=\"btn edit\"> Edit </button></td>");
table = table.concat("<td><button value = "
	+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
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
  usrdb.run("DELETE FROM posts WHERE id = ?", idToDelete);
  usrdb.all('SELECT * FROM posts', function(err, rows){
	  var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
table = table.concat("<tr> <td>"+rows[i].category+"</td><td id=title"
	+rows[i].id+" contenteditable=\"false\">" 
	+rows[i].title+"</td><td id=link"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].link+"</td><td id=desc"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].body+"</td>"); 
table = table.concat("<td><button id = editbtn"+rows[i].id+" value = "
	+rows[i].id+" type=\"button\" class=\"btn edit\"> Edit </button></td>");
table = table.concat("<td><button value = "
	+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
      }
      table = table.concat("</table>");
	  res.send(table);
  });
  usrdb.close();
});

app.get('/filter.js*', function(req, res) {
	var usrdb = new sqlite3.Database('static_files/users/'+req.query.username+'/posts.db');
	
	usrdb.all("SELECT DISTINCT category FROM posts", function(err, rows) {
		var filter = "<form role=\"form\"> <label for=\"sel1\"></label>"
			+ "<select multiple class=\"form-control\" id=\"sel1\">";
        for(i = 0; i < rows.length; ++i){
			filter = filter + "<option>"+rows[i].category+"</option>"
			console.log(rows[i].category);
		}
		filter = filter + "</select></form>";
		res.send(filter); 
	});
});

app.get('/fisher.js*', function(req, res) {
	var username = req.query.username;
	var filters = req.query.options.split(",");

	console.log(username);
	console.log(filters[0]);

	var usrdb = new sqlite3.Database('static_files/users/'+req.query.username+'/posts.db');
  usrdb.all('SELECT * FROM posts WHERE category IN ?',filters, function(err, rows){
	  var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
table = table.concat("<tr> <td id = cat"+rows[i].id+" contenteditable\"false\">"
	+rows[i].category+"</td><td id=title"+rows[i].id+" contenteditable=\"false\">" 
	+rows[i].title+"</td><td id=link"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].link+"</td><td id=desc"+rows[i].id+" contenteditable=\"false\">"
	+rows[i].body+"</td>"); 
table = table.concat("<td><button id = editbtn"+rows[i].id+" value = "
	+rows[i].id+" type=\"button\" class=\"btn edit\"> Edit </button></td>");
table = table.concat("<td><button value = "
	+rows[i].id+" type=\"button\" class=\"btn del\"> Delete </button></td></tr>");
      }
      table = table.concat("</table>");
	  res.send(table);
  });
  usrdb.close();
	res.send("<h1>PENIS</h1>");
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

// DELETE a user

app.delete('/users/*', function (req, res) {
  var nameToLookup = req.params[0];

  db.run('DELETE FROM users WHERE username = \'' + nameToLookup+'\'', function(err, row){

   });

  res.send('OK');
});

app.get('/people', function (req, res) {
  db.all('SELECT * FROM users', function(err, rows){
      var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
        table = table.concat("<tr><td><a href=\"userpage.html?name="+rows[i].username+"\">" + rows[i].username + "</a></td></tr>");
      }
      table = table.concat("</table>");
	  res.send(table);
  });

});

app.get('/userpage*', function (req, res) {
  var usrdb = new sqlite3.Database('static_files/users/'+req.query.name	+'/posts.db');

usrdb.all('SELECT * FROM posts', function(err, rows){
	  var table = "<table>";
      var i;
      for(i=0; i<rows.length; i++){
table = table.concat("<tr> <td id=title"+rows[i].id+">" 
	+rows[i].title+"</td><td id=link"+rows[i].id+">"
	+rows[i].link+"</td><td id=desc"+rows[i].id+">"
	+rows[i].body+"</td>"); 
      }
      table = table.concat("</table>");
	  res.send(table);
  });
  usrdb.close();
});

// start the server on http://localhost:3000/
var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Server started at http://localhost:%s/', port);
});
