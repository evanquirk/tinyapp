const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const { urlDB, userDB } = require('./databases');
const { generateRandomString, getUserByEmail , emailHasUser, usersURLs , cookieHasUser } = require('./helpers');

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

//==========LANDING PAGE REDIRECT ========//

app.get("/", (req, res) => {
  if (cookieHasUser(req.session.user_id, userDB)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//==============URLS INDEX===============//

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: usersURLs(req.session.user_id, urlDB),
    user: userDB[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});

//==============REGISTER================//

app.get("/register", (req, res) => {
  const userID = req.session.user_id
  console.log('req:',req.session.user_id);
  if (cookieHasUser(userID, userDB)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: userDB[userID],
    };
    res.render("urls_register", templateVars);
  }
});

//================LOGIN=================//

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user_id: req.session.user_id,
    urls: urlDB,
    user: userDB[userID]
  };
  res.render("urls_login", templateVars);
});

//===============NEW URL================//

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const userID = req.session.user_id;
    const shortURL = req.params.shortURL;
    const templateVars = {

      urls: urlDB,
      user: userDB[userID],
      shortURL,
    };

    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// short url view route - pull long url from database

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (req.session.user_id && urlDB[req.params.shortURL]) {
    if (userID !== urlDB[req.params.shortURL].userID) {
        res.status(403).send('Not correct user!');
    } else {
      const shortURL = req.params.shortURL;
      const longURL = urlDB[shortURL].longURL;
      const templateVars = { 
        user_id: userID,
        urls: urlDB,
        user: userDB[userID],
        shortURL, 
        longURL 
      };
    res.render("urls_show", templateVars);
    }
  } else {
    res.status(401).send("Please login to continue.")
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDB[shortURL].longURL;
  res.redirect(longURL);
});


//POST REQUESTS*****************************************************************


app.post("/register", (req, res) => {
  const { body: { email, password } } = req;
  const rID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password ) {
    res.status(400).send("Must fill both email and password fields.");
  }
  for (key in userDB) {
    if (userDB[key].email === email) {
      res.status(400).send("Email is already registered.");
    }
  }; 
  userDB[rID] = {
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
  let user = getUserByEmail(email, userDB);
  if (!user) {
    res.status(400).send("Email is not recognized");
  } else {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user['id'];
      res.redirect("/urls");
    } else {
      res.status(400).send("Password is not recognized");
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

  urlDB[shortURL] = { userID, longURL };

  res.redirect("/urls");
});

//============== EDIT URL ===============//

app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  if (urlDB[shortURL].userID === req.session.user_id) {
    urlDB[shortURL].longURL = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect("/login");
  }
});
//=============== DELETE ===============//

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDB[shortURL].userID === req.session.user_id) {
    delete urlDB[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

//============== APP LISTEN =============//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});