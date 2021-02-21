const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const { urlDB, userDB } = require('./databases');
const { generateRandomString, getUserByEmail, emailHasUser, usersURLs, cookieIsCurrentUser } = require('./helpers');

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
//checks if user is signed in. If yes, go to URL list, if no, redirect to login.

app.get("/", (req, res) => {
  if (cookieIsCurrentUser(req.session.user_id, userDB)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//==============URLS INDEX===============//
//checks if user is signed in. If yes, render urls list with user's URL list. If not signed in, 401 status and redirect to login.

app.get("/urls", (req, res) => {
  if (cookieIsCurrentUser(req.session.user_id, userDB)) {
    const templateVars = {
      urls: usersURLs(req.session.user_id, urlDB),
      user: userDB[req.session.user_id],
    }
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send("Youre not logged in. No biggie, everyone is forgetful sometimes. You can login <a href='/login'>here!</a>")
  }
});

//==============REGISTER================//
//check if user is signed in. If yes, redirect to urls page. If no, pass through to register page.

app.get("/register", (req, res) => {
  const cookieID = req.session.user_id;
  if (cookieIsCurrentUser(cookieID, userDB)) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: userDB[cookieID],
    };
    res.render("urls_register", templateVars);
  }
});

//================LOGIN=================//
//check if user is logged in. If yes, redirect to login. If no, pass to login page.

app.get("/login", (req, res) => {
  const cookieID = req.session.user_id;
  if (cookieIsCurrentUser(cookieID, userDB)) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: userDB[cookieID]
    };
    res.render("urls_login", templateVars);
  }
});

//===============NEW URL================//
//check if user is logged in. If no, redirect to login. If yes, load new url page.

app.get("/urls/new", (req, res) => {
  if (!cookieIsCurrentUser(req.session.user_id, userDB)) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: userDB[req.session.user_id]
    };
    res.render("urls_new", templateVars)
  }
});

//=========SHORT URL VIEW EDIT============//
//If user is logged in, and url is assigned to users login id, return url edit page. If not user's url, get 401 status.
//If url isn't in database, return 404.

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieID = req.session.user_id;

  if (urlDB[req.params.shortURL]) {
    if (cookieID === urlDB[shortURL].userID) {
      const templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDB[req.params.shortURL].longURL,
        userID: urlDB[req.params.shortURL].userID,
        user: userDB[req.session.user_id]
      };
      res.render("urls_show", templateVars);
    } else {
      res.status(401).send("This is not your URL. Why ya gotta try and mess with other people's stuff!? Please sign into the associated account to edit this URL.")
    }
  } else {
    res.status(404).send("Short URL Not Found! Slow your dang fingers down and learn how to type!")
  }
});

//=======VISIT SHORT URL AS LINK=======//
//If link is found in database, load page for anyone to view. If link is not found, send 404 error.

app.get("/u/:shortURL", (req, res) => {
  if (Object.keys(urlDB).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    const longURL = urlDB[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("This link cannot be found! Major bummer, bro.")
  }
});


//POST REQUESTS*****************************************************************


app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (!newEmail || !newPassword) {
    res.status(400).send("If you wanna get into this hot joint, you're gonna have to include a valid email and password!")
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
    res.status(403).send("there is no account associated with this email address - so make a new one and join in on all the fun!  ... seriously, do it.")
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
    res.status(401).send("Log in to create a short URL - Everybody is doing it!");
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
    res.status(401).send("This is not your URL. And with that attitude, it'll never be your URL. - Sign into associated account to edit your own mistakes.")
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
      res.status(401).send("This is not your URL. Sign into associated account to have this URL 'deleted' ... you murderer.")
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