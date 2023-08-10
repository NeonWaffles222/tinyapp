const express = require("express");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const generateRandomString = () => {
  randomString = Math.random().toString(36).slice(2, 8);
  //Check that the random string is not already used in the database
  if (!urlDatabase[randomString] && !users[randomString]) {
    return randomString;
  }
  return generateRandomString();
};

//Checks if the URL is valid
const isValidURL = (url) => {
  let testURL;

  try {
    testURL = new URL(url);
  } catch (_) {
    return false;
  }
  return true;
};
// returns the user if the provided key has the provided value
const userLookup = (key, value) => {
  for (let user in users) {
    if (users[user][key] === value) {
      return user;
    }
  }
  return null;
};

const urlsForUser = (id) => {
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]["userID"] === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "h5j3xa"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "sk4h7p"
  }
};

const users = {
  "h5j3xa": {
    id: "h5j3xa",
    username: "coolguy52",
    email: "fuze@gmail.com",
    password: "tempest"
  },
  "k4hxc5": {
    id: "k4hxc5",
    username: "Aurbur3",
    email: "chloe@hotmail.com",
    password: "wolf"
  },
  "sk4h7p": {
    id: "sk4h7p",
    username: "Admin",
    email: "noahm27@gmail.com",
    password: "noah"
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.send(`Please login or register to veiw URLs <a href=\"/login\">Login</a> <a href=\"/register\">Register</a>`);
    res.end();
    return;
  }
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlsForUser(req.cookies["user_id"])
  };
  console.log(urlsForUser(req.cookies["user_id"]));
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send(`This URL does not exist <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  if (!req.cookies["user_id"]) {
    res.send(`Please login or register to veiw URLs <a href=\"/login\">Login</a> <a href=\"/register\">Register</a>`);
    res.end();
    return;
  }

  if (req.cookies["user_id"] !== urlDatabase[req.params.id]["userID"]) {
    res.send(`This URL does not belong to you <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("user_new", templateVars);
});

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: users[req.cookies["user_id"]]
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
  if (!req.cookies["user_id"]) {
    res.send('Must be logged in to create urls <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  if (!isValidURL(req.body.longURL)) {
    res.send(`Invalid URL <a href=\"/urls/new\">Back</a>`);
    res.end();
    return;
  } else {
    const shortURL = generateRandomString();
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
  if (!req.cookies["user_id"]) {
    res.send('Must be logged in <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  if (req.cookies["user_id"] !== urlDatabase[req.params.id]["userID"]) {
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
  if (!req.cookies["user_id"]) {
    res.send('Must be logged in <a href=\"/login\">Login</a>');
    res.end();
    return;
  }
  if (req.cookies["user_id"] !== urlDatabase[req.params.id]["userID"]) {
    res.send(`This URL does not belong to you <a href=\"/urls\">Home</a>`);
    res.end();
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userID = userLookup("email", req.body.email);
  if (userID === null) {
    res.send(`Email not found <a href=\"/login\">Back</a>`);
    res.status(403);
    res.end();
    return;
  }

  if (users[userID]["password"] !== req.body.password) {
    res.send(`Wrong password <a href=\"/login\">Back</a>`);
    res.status(403);
    res.end();
    return;
  }

  res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  // added "required in the ejs file so this is not needed"
  // if (req.body.username == "" || req.body.email == "" || req.body.password == "") {
  //   res.status(400);
  //   res.redirect("/register");
  // }

  if (userLookup("email", req.body.email) !== null) {
    res.status(400).send(`Email is already in use <a href=\"/register\">Back</a>`);
    res.end();
    return;
  }

  if (userLookup("username", req.body.username) !== null) {
    res.status(400).send(`Username is already in use <a href=\"/register\">Back</a>`);
    res.end();
    return;
  }

  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", userID);
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

