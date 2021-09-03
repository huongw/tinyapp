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

const checkURL = function(url, database) {
  for (const shortURL in database) {
    if (url === shortURL) {
      return true;
    }
  }

  return false;
};

// -- GET METHODS ----------------------------------------------
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    res.redirect("/login")
    return;
  }

  res.redirect("/urls");
})

app.get("/urls", (req, res) => {
  // Fetch user ID from session
  const userId = req.session.user_id;
  const user = users[userId];

  if (user) {
    const formatUserDatabase = urlsForUser(user.id, urlDatabase);

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
  const userId = req.session.user_id;
  const user = users[userId];

  if (!userId) {
    return res.status(401).redirect("/login");
  }

  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const longURL = urlsForUser(userId, urlDatabase)[shortURL];
  const user = users[userId];
  const isTrue = checkURL(shortURL, urlDatabase);

  const templateVars = {
    shortURL,
    longURL,
    user,
  };

  if (userId) {
    if (isTrue) {
     const urlUserID = urlDatabase[shortURL].userID
    
     if (userId === urlUserID) {
       res.render("urls_show", templateVars);
      } else {
       return res.send("You Do Not Have Access");
      }
    } else if (!isTrue) {
      res.send("URL Does Not Exist")
    }
  } else {
     return res.status(401).send("<h1>You Are Not Logged In <a href='/login'>Go Back</a></h1>");
  }
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

  if(userID) {
    return res.redirect("/urls");
  }

  res.render("registration", { user: null });
});

// LOGIN
app.get("/login", (req, res) => {
  const userID = req.session.user_id;

  if(userID) {
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
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  const shortURLObj = urlDatabase[shortURL];

  if (!shortURLObj || userID !== shortURLObj.userID) {
    return res.status(403).send("<h1>Not Allowed to Access</h1>");
  }

  urlDatabase[shortURL] = longURL;

  res.redirect("/urls");
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  const shortURLObj = urlDatabase[shortURL];

  if (!shortURLObj || userID !== shortURLObj.userID) {
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

  const user = getUserByEmail(users, email);

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
  const user = getUserByEmail(users, email);

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
