
const generateRandomString = function() {
  return Math.random().toString(36).substring(6, 12);
};

const checkEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};


module.exports = { generateRandomString , checkEmail };