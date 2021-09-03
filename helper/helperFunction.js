// -- GET USER EMAIL FUNCTION ---------------------------------
const getUserByEmail = function (users, email) {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }

  return null;
};

// -- GET URL FOR USER ---------------------------------------
const urlsForUser = (userID, urlDatabase) => {
  let userDatabase = {};

  for (const key in urlDatabase) {
    if (userID === urlDatabase[key].userID) {
      userDatabase[key] = urlDatabase[key].longURL;
    }
  }
  return userDatabase;
};

// -- GENERATE ID FUNCTION ------------------------------------
const generateRandomString = function (length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };
