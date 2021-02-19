
// const bcrypt = xrequire('bcryptjs');

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
const findEmail = (email, users) => {
  for (const key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
};


module.exports = { generateRandomString , checkEmail , findEmail };