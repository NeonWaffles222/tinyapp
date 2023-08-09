const express = require("express");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

function generateRandomString() {
  randomString = Math.random().toString(36).slice(2, 8);
  //Check that the random string is not already used in the database
  if (!urlDatabase[randomString]) {
    return randomString;
  }
  return generateRandomString();
}

//Checks if the URL is valid
function isValidURL(url) {
  let testURL;

  try {
    testURL = new URL(url);
  } catch (_) {
    return false;
  }
  return true;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("user_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.post("/urls", (req, res) => {
  if (!isValidURL(req.body.longURL)) {
    console.log("Invalid URL");
    res.redirect("/urls/new");
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/:id", (req, res) => {
  if (!isValidURL(req.body.longURL)) {
    console.log("Invalid URL");
    res.redirect(`/urls/${req.params.id}`);
  } else {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

