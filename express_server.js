const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

// -- OBJECTS ----------------------------------------------
const urlDatabase = {
  b6UTxQ: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },

  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },

  cxYzPo: {
    longURL: "https://www.youtube.com",
    userID: "userRandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$Kx9adL2aFW3a7iFvXp1zmOtxVuiwM0TTlxpxrmOh7Ny9sH4z6Sdnq",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$Kx9adL2aFW3a7iFvXp1zmOtxVuiwM0TTlxpxrmOh7Ny9sH4z6Sdnq",
  },
};

// -- GET URL FOR USER ---------------------------------------
const urlsForUser = (userID) => {
  let userDatabase = {};

  for (const key in urlDatabase) {
    if (userID === urlDatabase[key].userID) {
      userDatabase[key] = urlDatabase[key].longURL;
    }
  }
  return userDatabase;
};

// -- GET USER EMAIL FUNCTION ---------------------------------
const getUserByEmail = function (email) {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }

  return null;
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

// -- GET METHODS ----------------------------------------------
app.get("/urls", (req, res) => {
  // Fetch user ID from cookie
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (user) {
    const formatUserDatabase = urlsForUser(user.id);

    const templateVars = {
      urls: formatUserDatabase,
      user,
    };

    res.render("urls_index", templateVars);
  }

  if (!userId) {
    return res.status(401).redirect("/login");
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (!userId) {
    return res.status(401).redirect("/login");
  }

  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// REGISTER
app.get("/register", (req, res) => {
  res.render("registration", { user: null });
});

// LOGIN
app.get("/login", (req, res) => {
  res.render("login", { user: null });
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies["user_id"];
  const longURL = urlsForUser(userId)[shortURL];
  const user = users[userId];

  if (!userId) {
    return res.status(401).redirect("/login");
  }

  const templateVars = {
    shortURL,
    longURL,
    user,
  };

  res.render("urls_show", templateVars);
});

// -- POST METHODS ---------------------------------------------
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // longURL is the name in the form, the variable longURL stores the value(website) from the body object
  const shortURL = generateRandomString(6);
  const userID = req.cookies["user_id"];

  if (!userID) {
    return res.status(400).send("Not Allowed to Access");
  }

  urlDatabase[shortURL] = {
    longURL,
    userID,
  };

  res.redirect(`/urls/${shortURL}`);
});

// REGISTER
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    res.status(400).send("Email and password cannot be blank");
    return;
  }

  const user = getUserByEmail(email);
  if (user) {
    res.status(400).send("User already exists");
    return;
  }

  const id = generateRandomString(6);

  const newUser = { id, email, password: hashedPassword };
  users[id] = newUser;

  res.cookie("user_id", id);
  res.redirect("/urls");
});

// LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!user) {
    return res.status(403).send("User Not Found");
  }

  // COMPARE USER PASSWORD
  const isTrue = bcrypt.compareSync(password, user.password);

  if (!isTrue) {
    return res.status(403).send("Password Is Incorrect");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// LOG OUT
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  const shortURLObj = urlDatabase[shortURL];

  if (!shortURLObj || userID !== shortURLObj.userId) {
    return res.status(403).send("<h1>Not Allowed to Access</h1>");
  }

  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userID = req.cookies["user_id"];
  const shortURLObj = urlDatabase[shortURL];

  if (!shortURLObj || userID !== shortURLObj.userId) {
    return res.status(403).send("<h1>Not Allowed to Access</h1>");
  }

  urlDatabase[shortURL] = longURL;

  res.redirect("/urls");
});

// LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
