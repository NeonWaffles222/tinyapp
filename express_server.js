const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const morgan = require('morgan');
const { generateRandomString, isValidURL, userLookup, urlsForUser } = require("./helpers");

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

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
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

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send(`This URL does not exist <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  if (!req.session.user_id) {
    res.send(`Please login or register to veiw URLs <a href=\"/login\">Login</a> <a href=\"/register\">Register</a>`);
    res.end();
    return;
  }

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

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("user_new", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: users[req.session.user_id]
  };

  res.render("user_login", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send(`Short URL does not exist <a href=\"/urls\">Back</a>`);
    res.end();
    return;
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send('Must be logged in to create urls <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  if (!isValidURL(req.body.longURL)) {
    res.send(`Invalid URL <a href=\"/urls/new\">Back</a>`);
    res.end();
    return;
  } else {
    const shortURL = generateRandomString(urlDatabase, users);
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send(`This URL does not exist <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  if (!req.session.user_id) {
    res.send('Must be logged in <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  if (req.session.user_id !== urlDatabase[req.params.id]["userID"]) {
    res.send(`This URL does not belong to you <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  if (!isValidURL(req.body.longURL)) {
    res.send(`Invalid URL <a href=\"/urls/${req.params.id}\">Back</a>`);
    res.end();
    return;
  } else {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send(`This URL does not exist <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  if (!req.session.user_id) {
    res.send('Must be logged in <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  if (req.session.user_id !== urlDatabase[req.params.id]["userID"]) {
    res.send(`This URL does not belong to you <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userID = userLookup("email", req.body.email, users);
  if (userID === null) {
    res.send(`Email not found <a href=\"/login\">Back</a>`);
    res.status(403);
    res.end();
    return;
  }
  if (!bcrypt.compareSync(req.body.password, users[userID]["password"])) {
    res.send(`Wrong password <a href=\"/login\">Back</a>`);
    res.status(403);
    res.end();
    return;
  }

  req.session.user_id = userID;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  // added "required in the ejs file so this is not needed"
  // if (req.body.username == "" || req.body.email == "" || req.body.password == "") {
  //   res.status(400);
  //   res.redirect("/register");
  // }

  if (userLookup("email", req.body.email, users) !== null) {
    res.status(400).send(`Email is already in use <a href=\"/register\">Back</a>`);
    res.end();
    return;
  }

  if (userLookup("username", req.body.username, users) !== null) {
    res.status(400).send(`Username is already in use <a href=\"/register\">Back</a>`);
    res.end();
    return;
  }

  const userID = generateRandomString(urlDatabase, users);
  users[userID] = {
    id: userID,
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, salt)
  };
  req.session.user_id = userID;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

