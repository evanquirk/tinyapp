
const generateRandomString = function() {
  return Math.random().toString(36).substring(6, 12);
};


//Truthy Value Return if Email Has User Associated With It
const emailHasUser = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

//Get ID associated with an email address.
const getUserByEmail = (email, users) => {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
};

//Get list of URLs associated with a users id
const usersURLs = (id, urlDB) => {
  const userUrls = {};
  for (const shortURL in urlDB) {
    if (urlDB[shortURL].userID === id) {
      userUrls[shortURL] = urlDB[shortURL];
    }
  }
  return userUrls;
}

//Check to see if the current cookie has a user associated with it.
const cookieHasUser = (cookie, users) => {
  for (const user in users) {
    if (cookie === user) {
      return true;
    }
  } return false;
};


module.exports = { generateRandomString , emailHasUser , getUserByEmail, usersURLs , cookieHasUser};