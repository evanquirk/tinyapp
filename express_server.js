const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const express = require("express");
const { generateRandomString, getUserByEmail } = require('./helpers');


const app = express();
const PORT = 8080;


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 24 * 60 * 60 * 1000
  })
);

// URL DATABASE//

const urlDatabase = {
  b2xVn2: { 
    longURL: "http://www.lighthouselabs.ca", 
    userID: "123" },
  '9sm5xK': { 
    longURL: "http://www.google.com", 
    userID: "userRandomID" }
};

// USERS DATABASE //

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


//==============LANDING PAGE REDIRECT ================//

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//==============URLS INDEX===============//

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    const userID = req.session.user_id;
    const userURLS = {};
    for (const key in urlDatabase) {
      if (urlDatabase[key].userID === req.session.user_id) {
        userURLS[key] = urlDatabase[key];
      }
    }
    const templateVars = {
      urls: userURLS,
      user: users[req.session.user_id],
      email: req.body.email
    };
    res.render("urls_index", templateVars);
  } else {
    // res.status(401).send("Please Login, or Register to continue.");
    res.redirect("/login");
  }
});
//==============REGISTER================//

app.get("/register", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    user_id: req.session.user_id,
    urls: urlDatabase,
    user: users[userID],
  };
  res.render("urls_register", templateVars);
});

//================LOGIN=================//

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user_id: req.session.user_id,
    urls: urlDatabase,
    user: users[userID]
  };
  res.render("urls_login", templateVars);
});

//===============NEW URL================//

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const user = req.session.user_id;

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
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  if (userID !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send('Not correct user!');
  } else {
    const templateVars = { 
      user_id: userID,
      urls: urlDatabase,
      user: users[userID],
      shortURL, 
      longURL 
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});


//POST REQUESTS*****************************************************************


app.post("/register", (req, res) => {
  const { body: { email, password } } = req;
  const rID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password ) {
    res.status(400).send("Must fill both email and password fields");
  }
  for (key in users) {
    if (users[key].email === email) {
      res.status(400).send("Email is already registered.");
    }
  }; 
  users[rID] = {
    id: rID,
    password: hashedPassword,
    email
  };
  req.session.user_id = rID;
  res.redirect("/urls");
  }
);

app.post("/login", (req, res) => {
  const { body: { email, password } } = req;
  let user = getUserByEmail(email, users);
  console.log(user);
  if (!user) {
    res.status(403).send("Email is not recognized");
  } else {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user['id'];
      res.redirect("/urls");
    } else {
      res.status(403).send("Password is not recognized");
    }
  }
});
  

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// add new url to database and redirect to show short url page
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.session.user_id;

  urlDatabase[shortURL] = { userID, longURL };

  res.redirect(`/urls/${shortURL}`);
});

//============== EDIT URL ===============//

app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
//=============== DELETE ===============//

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
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