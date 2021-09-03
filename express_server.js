const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const { getUserByEmail, urlsForUser, generateRandomString } = require("./helper/helperFunction");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);
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

// -- GET METHODS ----------------------------------------------
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.redirect("/login");
  }

  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  // Fetch user ID from session
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.status(401).send("<h1>You Are Not Logged In <a href='/login'>Log In Here</a></h1>");
  }

  const urls = urlsForUser(user.id, urlDatabase);
  const templateVars = { urls, user };

  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!userId) {
    return res.status(401).redirect("/login");
  }

  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send("<h1>You Are Not Logged In <a href='/login'>Go Back</a></h1>");
  }

  const shortURL = req.params.shortURL;
  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    return res.status(400).send("URL Not Found");
  }
  
  if (urlObj.userID !== userId) {
    return res.status(403).send("You Do Not Have Access");
  }

  const longURL = urlObj.longURL;
  const user = users[userId];
  const templateVars = { shortURL, longURL, user };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];

  if (!url) {
    return res.status(404).send("Page Not Found");
  }

  res.redirect(url.longURL);
});

// REGISTER
app.get("/register", (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    return res.redirect("/urls");
  }

  res.render("registration", { user: null });
});

// LOGIN
app.get("/login", (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    return res.redirect("/urls");
  }
  
  res.render("login", { user: null });
});

// -- POST METHODS ---------------------------------------------
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // longURL is the name in the form, the variable longURL stores the value(website) from the body object
  const shortURL = generateRandomString(6);
  const userID = req.session.user_id;

  if (!userID) {
    return res.status(400).send("Not Allowed to Access");
  }

  urlDatabase[shortURL] = {
    longURL,
    userID,
  };

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("<h1>You Need To Log In</h1>");
  }

  const shortURL = req.params.shortURL;
  const urlObj = urlDatabase[shortURL];
  if (userID !== urlObj.userID) {
    return res.status(403).send("<h1>Not Allowed to Access</h1>");
  }

  if (!req.body.longURL) {
    return res.status(400).send("<h1>URL Cannot Be Blank</h1>");
  }
  
  urlObj.longURL = req.body.longURL;

  res.redirect("/urls");
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("<h1>You Need To Log In</h1>");
  }

  const shortURL = req.params.shortURL;
  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    return res.status(403).send("<h1>URL Does Not Exist</h1>");
  }

  if (userID !== urlObj.userID) {
    return res.status(403).send("<h1>Not Allowed to Access</h1>");
  }

  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

// REGISTER
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    res
      .status(400)
      .send(
        "Email and password cannot be blank <a href='/register'>Try Again</a>"
      );
    return;
  }

  const user = getUserByEmail(email, users);

  if (user) {
    res.status(400).send("User already exists");
    return;
  }

  const id = generateRandomString(6);

  const newUser = { id, email, password: hashedPassword };
  users[id] = newUser;

  req.session.user_id = id;
  res.redirect("/urls");
});

// LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res
      .status(403)
      .send("Your login is incorrect/invalid <a href='/login'>Try Again</a>");
  }

  // COMPARE USER PASSWORD
  const isTrue = bcrypt.compareSync(password, user.password);

  if (!isTrue) {
    return res
      .status(403)
      .send("Your login is incorrect/invalid <a href='/login'>Try Again</a>");
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

// LOG OUT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
