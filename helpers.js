

//Generate Random 6 String Key for Short URL
const generateRandomString = function () {
  return Math.random().toString(36).substring(6, 12);
};


//Truthy Value will return if email has user associated with it.
const emailHasUser = (email, userDB) => {
  for (const user in userDB) {
    if (userDB[user].email === email) {
      return true;
    }
  }
  return false;
};

//Get ID associated with an email address.
const getUserByEmail = (email, userDB) => {
  for (const userID in userDB) {
    if (userDB[userID].email === email) {
      return userDB[userID].id;
    }
  }
};

//Get list of URLs associated with a users id.
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
const cookieHasUser = (cookie, userDB) => {
  for (const userKey in userDB) {
    if (cookie === userKey) {
      return true;
    }
  } return false;
};


module.exports = { generateRandomString, emailHasUser, getUserByEmail, usersURLs, cookieHasUser };