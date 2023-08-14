const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const morgan = require('morgan');
const { generateRandomString, userLookup, urlsForUser } = require("./helpers");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: "session",
  keys: ["aoiw2hj38ynbjkns"],
  maxAge: 24 * 60 * 60 * 1000
}));
const salt = bcrypt.genSaltSync(10);

// default urls used for testing
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "h5j3xa"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "k4hxc5"
  }
};

// default users used for testing
const users = {
  "h5j3xa": {
    id: "h5j3xa",
    username: "coolguy52",
    email: "fuze@gmail.com",
    password: bcrypt.hashSync("tempest", salt)
  },
  "k4hxc5": {
    id: "k4hxc5",
    username: "Aurbur3",
    email: "chloe@hotmail.com",
    password: bcrypt.hashSync("wolf", salt)
  },
};

// just redirects to /urls
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Home page. Asks user to login or register if not logged in
app.get("/urls", (req, res) => {
  // checks cookies to see if the user is logged in
  if (!req.session.user_id) {
    res.send(`Please login or register to veiw URLs <a href=\"/login\">Login</a> <a href=\"/register\">Register</a>`);
    res.end();
    return;
  }
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

//  Page to add a new url. Redirects to login page if not logged in
app.get("/urls/new", (req, res) => {
  // checks cookies to see if the user is logged in
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

// Page to view URL info and edit it.
app.get("/urls/:id", (req, res) => {
  // checks cookies to see if the user is logged in
  if (!req.session.user_id) {
    res.send(`Please login or register to veiw URLs <a href=\"/login\">Login</a> <a href=\"/register\">Register</a>`);
    res.end();
    return;
  }
  // checks the database to make sure the requested URL exists
  if (!urlDatabase[req.params.id]) {
    res.send(`This URL does not exist <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  // Checks if the user has permission to view this URL.
  if (req.session.user_id !== urlDatabase[req.params.id]["userID"]) {
    res.send(`This URL does not belong to you <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

// Page to register as a new user.
app.get("/register", (req, res) => {
  // If the user is already logged in sends them to the home page.
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("user_new", templateVars);
});

// Page to login.
app.get("/login", (req, res) => {
  // If the user is already logged in sends them to the home page.
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("user_login", templateVars);
});

// Will redirect to the long URL that is linked to this short URL.
app.get("/u/:id", (req, res) => {
  // checks the database to make sure the requested URL exists
  if (!urlDatabase[req.params.id]) {
    res.send(`Short URL does not exist <a href=\"/urls\">Back</a>`);
    res.end();
    return;
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// View all URLS in the database
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// For adding a new short URL
app.post("/urls", (req, res) => {
  // Checks if the user is logged in
  if (!req.session.user_id) {
    res.send('Must be logged in to create urls <a href=\"/login\">Login</a>');
    res.end();
    return;
  }

  // Creates a new short url
  const shortURL = generateRandomString(urlDatabase, users);
  urlDatabase[shortURL] = {
    "longURL": req.body.longURL,
    "userID": req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);

});

// Edits a URL
app.post("/urls/:id", (req, res) => {
  // Checks if the user is logged in
  if (!req.session.user_id) {
    res.send('Must be logged in <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  // Checks if the URL exists
  if (!urlDatabase[req.params.id]) {
    res.send(`This URL does not exist <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  // Checks if the user has permission to edit this URL.
  if (req.session.user_id !== urlDatabase[req.params.id]["userID"]) {
    res.send(`This URL does not belong to you <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }

  // Updates the URL
  urlDatabase[req.params.id]["longURL"] = req.body.longURL;
  res.redirect("/urls");

});

// Removes a URL
app.post("/urls/:id/delete", (req, res) => {
  // Checks if the user is logged in
  if (!req.session.user_id) {
    res.send('Must be logged in <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  // Checks if the URL exists
  if (!urlDatabase[req.params.id]) {
    res.send(`This URL does not exist <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  // Checks if the user has permission to delete this URL.
  if (req.session.user_id !== urlDatabase[req.params.id]["userID"]) {
    res.send(`This URL does not belong to you <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Logs the user in
app.post("/login", (req, res) => {
  const userID = userLookup("email", req.body.email, users);
  // Checks if the user exists
  if (userID === null) {
    res.send(`Email not found <a href=\"/login\">Back</a>`);
    res.status(403);
    res.end();
    return;
  }
  // Checks if the passwords match
  if (!bcrypt.compareSync(req.body.password, users[userID]["password"])) {
    res.send(`Wrong password <a href=\"/login\">Back</a>`);
    res.status(403);
    res.end();
    return;
  }
  // creates a new cookie for the user
  req.session.user_id = userID;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  // Removes the users cookie
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  // added "required in the ejs file so this is not needed"
  // if (req.body.username == "" || req.body.email == "" || req.body.password == "") {
  //   res.status(400);
  //   res.redirect("/register");
  // }

  // Checks if the email is already in use
  if (userLookup("email", req.body.email, users) !== null) {
    res.status(400).send(`Email is already in use <a href=\"/register\">Back</a>`);
    res.end();
    return;
  }
  // Checks if the username is already in use
  if (userLookup("username", req.body.username, users) !== null) {
    res.status(400).send(`Username is already in use <a href=\"/register\">Back</a>`);
    res.end();
    return;
  }
  // Creates a new user in the database
  const userID = generateRandomString(urlDatabase, users);
  users[userID] = {
    id: userID,
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, salt)
  };
  // Logs the user in and sends them to the home page
  req.session.user_id = userID;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

