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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("user_new", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  res.render("user_login", templateVars);
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
  const userID = userLookup("email", req.body.email);
  if (userID === null) {
    console.log("User not found");
    res.status(403);
    res.redirect("/login");
    return;
  }

  if (users[userID]["password"] !== req.body.password) {
    console.log("Wrong password");
    res.status(403);
    res.redirect("/login");
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

  if (!userLookup("email", req.body.email)) {
    console.log("email in use");
    res.status(400);
    res.redirect("/register");
    return;
  }

  if (!userLookup("username", req.body.username)) {
    res.status(400);
    res.redirect("/register");
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

