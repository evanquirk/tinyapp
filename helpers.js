
const generateRandomString = function() {
  return Math.random().toString(36).substring(6, 12);
};


//Truthy Value
const checkEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

//Actual value
const getUserByEmail = (email, users) => {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
};


module.exports = { generateRandomString , checkEmail , getUserByEmail };