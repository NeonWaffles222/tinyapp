const generateRandomString = (urlDatabase, users) => {
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
const userLookup = (key, value, users) => {
  for (let user in users) {
    if (users[user][key] === value) {
      return users[user];
    }
  }
  return null;
};

const urlsForUser = (id, urlDatabase) => {
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]["userID"] === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

module.exports = {
  generateRandomString,
  isValidURL,
  userLookup,
  urlsForUser,
};