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

module.exports = getUserByEmail;
