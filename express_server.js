const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { generateRandomString , checkEmail } = require('./helpers');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "123" },
  '9sm5xK': { longURL: "http://www.google.com", userID: "userRandomID" }
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
  },
  "123": {
    id: "123",
    email: "test@test.ca",
    password: "123"
  }
};

//==============LANDING================//

app.get("/", (req, res) => {
  res.send("Hello!");
});

//==============COOKIES================//

app.get('/', function(req, res) {
  console.log('Cookies: ', req.cookies);
  console.log('Signed Cookies: ', req.signedCookies);
});

//==============URLS INDEX===============//

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const user = users[req.cookies["user_id"]];
    // console.log(user);
    const userURLS = {};
    for (const key in urlDatabase) {
      if (urlDatabase[key].userID === req.cookies["user_id"]) {
        userURLS[key] = urlDatabase[key];
      };
    }
    const templateVars = {
      urls: userURLS,
      user
    };
    res.render("urls_index", templateVars);
  } else {
    // res.status(401).send("Please Login, or Register to continue.");
    res.redirect("/login");
  }
});
//==============REGISTER================//

app.get("/register", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_register", templateVars);
});

//================LOGIN=================//

app.get("/login", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_login", templateVars);
});

//===============NEW URL================//

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const user = users[req.cookies["user_id"]];
    
    const templateVars = {
      urls: urlDatabase,
      user
    };
  
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// short url view route - pull long url from database

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const user = users[req.cookies["user_id"]];
  const templateVars = { shortURL, longURL , user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post("/register", (req, res) => {
  const { body: { email, password } } = req;
  const rID = generateRandomString();
  
  if (!email || !password || checkEmail(email, users)) {
    res.status(400).send("Bad Gateway. No Email Or Password, or Email in use.");
  } else {
    users[rID] = {id: rID, email, password };
    res.cookie("user_id", rID);
    res.redirect("/urls");
    console.log(users[rID]);
  }
});


app.post("/login", (req, res) => {
  const { body: { email, password } } = req;

  const findEmail = (email, users) => {
    for (const key in users) {
      if (users[key].email === email) {
        return users[key];
      }
    }
  };

  const authenticateUser = (password, user) => {
    if (user.password === password) {
      return user.id;
    }
  };

  const validEmail = findEmail(email, users);

  if (validEmail) {
    const userId = authenticateUser(password, validEmail);
    if (userId) {
      res.cookie("user_id", userId);
      res.redirect("/urls");
    } else {
      res.status(403).send("Invalid Password.");
    }
  } else {
    res.status(403).send("Invalid Email");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
  //set a cookie to username (value in the request body)
  //redirect back to /urls page
});

// add new url to database and redirect to show short url page
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.cookies["user_id"];

  urlDatabase[shortURL] = { userID, longURL };
  
  res.redirect(`/urls/${shortURL}`);
});

//============== EDIT URL ===============//

app.post("/urls/:shortURL",(req,res)=>{
  const longURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.cookies["user_id"]) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
//=============== DELETE ===============//

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.cookies["user_id"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});


//============== APP LISTEN =============//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});