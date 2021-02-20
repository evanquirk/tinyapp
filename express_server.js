const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const { urlDB, userDB } = require('./databases');
const { generateRandomString, getUserByEmail, emailHasUser, usersURLs, cookieIsCurrentUser } = require('./helpers');
const e = require("express");

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
  if (cookieIsCurrentUser(req.session.user_id, userDB)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//==============URLS INDEX===============//

app.get("/urls", (req, res) => {
  if (cookieIsCurrentUser(req.session.user_id, userDB)) {
    let templateVars = {
      urls: usersURLs(req.session.user_id, urlDB),
      user: userDB[req.session.user_id],
    }
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send("Youre not logged in. No biggie, everyone is forgetful sometimes. You can login <a href='/login'>here!</a>")
  }
});

//==============REGISTER================//

app.get("/register", (req, res) => {
  const cookieID = req.session.user_id;
  if (cookieIsCurrentUser(cookieID, userDB)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: userDB[cookieID],
    };
    res.render("urls_register", templateVars);
  }
});

//================LOGIN=================//

app.get("/login", (req, res) => {
  const cookieID = req.session.user_id;
  if (cookieIsCurrentUser(cookieID, userDB)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: userDB[cookieID]
    };
    res.render("urls_login", templateVars);
  }
});

//===============NEW URL================//

app.get("/urls/new", (req, res) => {
  if (!cookieIsCurrentUser(req.session.user_id, userDB)) {
    res.redirect("/login");
  } else {
    let templateVars = {
      user: userDB[req.session.user_id]
    };
    res.render("urls_new", templateVars)
  }
});

//=========SHORT URL VIEW EDIT============//

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieID = req.session.user_id;

  if (urlDB[req.params.shortURL]) {
    if (cookieID === urlDB[shortURL].userID) {
      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDB[req.params.shortURL].longURL,
        userID: urlDB[req.params.shortURL].userID,
        user: userDB[req.session.user_id]
      };
      res.render("urls_show", templateVars);
    } else {
      res.status(401).send("This is not your URL. Why ya gotta try and mess with it!? Please sign into the associated account to edit this URL.")
    }
  } else {
    res.status(404).send("Short URL Not Found! Slow your dang fingers down and learn how to type!")
  }
});

//=======VISIT SHORT URL AS LINK=======//

app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL === urlDB[req.params.shortURL]) {
    const shortURL = req.params.shortURL;
    const longURL = urlDB[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("This link cannot be found! Major bummer.")
  }
});


//POST REQUESTS*****************************************************************


app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (!newEmail || !newPassword) {
    res.status(400).send("Please include a valid email and password. Or don't. I'm a website, not a cop.'")
  } else if (emailHasUser(newEmail, userDB)) {
    res.status(400).send("Account already associated with this email address. Go make a new one, they are free.")
  } else {
    const newUserID = generateRandomString();
    userDB[newUserID] = {
      id: newUserID,
      email: newEmail,
      password: bcrypt.hashSync(newPassword, 10)
    };
    req.session.user_id = newUserID;
    res.redirect("/urls");
  }
});

//============== LOGIN ===============//

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!emailHasUser(email, userDB)) {
    res.status(403).send("there is no account associated with this email address - so make a new one and join in on all the fun!")
  } else {
    const userID = getUserByEmail(email, userDB);
    if (!bcrypt.compareSync(password, userDB[userID].password)) {
      res.status(403).send("Password Incorrect.")
    } else {
      req.session.user_id = userID;
      res.redirect("/urls");
    }
  }
});

//========= ADD NEW URL TO DATABASE =========//

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    const userID = req.session.user_id;
    urlDB[shortURL] = {
      userID,
      longURL
    }
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).send("Log in to create a short URL. Everybody is doing it.");
  }
});

//=============== EDIT URL ================//

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieID = req.session.user_id;

  if (cookieID === urlDB[shortURL].userID) {
    urlDB[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');

  } else {
    res.status(401).send("This is not your URL. And with that attitude, it'll never be your URL. - Sign into associated account to edit.")
  }
});

//================ DELETE =================//

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieID = req.session.user_id;

  if (urlDB[req.params.shortURL]) {
    if (cookieID === urlDB[shortURL].userID) {
      delete urlDB[shortURL];
      res.redirect('/urls');
    } else {
      res.status(401).send("This is not your URL. Sign into associated account to delete this URL, you murderer.")
    };
  } else {
    res.status(404).send("Short URL Not Found! Slow your dang fingers down and learn how to type!")
  };
});

//============== LOGOUT==============//

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//============== APP LISTEN =============//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});