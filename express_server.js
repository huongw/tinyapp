const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const checkIfEmailExists = function(email, user) {
  if (user.email === email) {
    return true;
  }
  return false;
}

const generateRandomString = function(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
 return result;
};

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (!user) {
    res.send("You are not logged in")
    return;
  }

  const templateVars = {
    urls: urlDatabase,
    user
  }
  res.render("urls_index", templateVars);
})

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // longURL is the name in the form, the variable longURL stores the value(website) from the body object
  const shortURL = generateRandomString(6);

  urlDatabase[shortURL] = longURL; // stores the website into the urlDatabase object with the shortURL as the key
  res.redirect(`/urls/${shortURL}`);    
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (!user) {
    res.send("You are not logged in")
    return;
  }
  
  const templateVars = {
    user
  };

  res.render("urls_new", templateVars);
})

app.get("/register", (req, res) => {
  res.render("registration");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (!user) {
    res.send("You are not logged in")
    return;
  }

  const templateVars = {
    shortURL,
    longURL,
    user
  }

  res.render("urls_show", templateVars);
})

app.post("/register", (req, res) => {
  const userId = generateRandomString(6);
  const email = req.body.email;
  const password = req.body.password;
  const newUser = {
    id: userId,
    email,
    password
  };
  users[userId] = newUser;

  const emailExists = checkIfEmailExists(email, users[userId])

  if (users[userId].email === "" || users[userId].password === "") {
    res.send("400");
    return;
  }
  
  if (emailExists) {
    res.send("400");
    return;
  }

  res.cookie("user_id", userId);
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {

  const shortURL = req.params.shortURL;

  delete urlDatabase[shortURL];

  res.redirect("/urls");

});

app.post("/urls/:shortURL", (req, res) => {

  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = longURL;

  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
