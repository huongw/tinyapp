const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
 return result;
};

// console.log(generateRandomString(6))

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase}
  res.render("urls_index", templateVars);
})

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // longURL is the name in the form, the variable longURL stores the value(website) from the body object
  const shortURL = generateRandomString(6);
  console.log("shortURL", shortURL)
  urlDatabase[shortURL] = longURL; // stores the website into the urlDatabase object with the shortURL as the key
  res.redirect(`/urls/${shortURL}`);    
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  const templateVars = {
    shortURL,
    longURL
  }

  res.render("urls_show", templateVars);
})

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
