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
  const userID = req.session.user_id;
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
  if (cookieHasUser(userID, userDB)) {
    res.redirect("/urls");
  } else {
  const templateVars = {
    user: userDB[userID]
  };
  res.render("urls_login", templateVars);
  }
});

//===============NEW URL================//

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL
  if (!cookieHasUser(userID, userDB)) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: userDB[userID],
      shortURL,
    };
    res.render("urls_new", templateVars)
  }
});

//=========SHORT URL VIEW EDIT============//

app.get("/urls/:shortURL", (req, res) => {
  if (urlDB[req.params.shortURL]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDB[req.params.shortURL].longURL,
      userID: urlDB[req.params.shortURL].userID,
      user: userDB[req.session.user_id]
    };
    res.render("urls_show", templateVars);
    } else {
      res.status(404).send("Not Found")
    }
  });


//=======VISIT SHORT URL AS LINK=======//

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDB[shortURL].longURL;
  res.redirect(longURL);
});


//POST REQUESTS*****************************************************************


app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (!newEmail || !newPassword) {
    res.status(400).send("Please include a valid email and password'")
  } else if (emailHasUser(newEmail, userDB)) {
    res.status(400).send("Account already associated with this email address.")
  } else {
    const newUserID = generateRandomString();
    userDB[newUserID] = {
      id: newUserID,
      email: newEmail,
      password: bcrypt.hashSync(newPassword, 10)
    };
    req.session.user_id =newUserID;
    res.redirect("/urls");
  }
});

//============== LOGIN ===============//

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(userDB);
  if (!emailHasUser(email, userDB)) {
    res.status(403).send("there is no account associated with this email address.")
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
  res.status(401).send("Log in to create a short URL.");
}
});

//=============== EDIT URL ================//

app.post("/urls/:shortURL", (req, res) => {
 const userID = req.session.user_id;
 const userUrls = usersURLs(userID, urlDB);
 if (Object.keys(userUrls).includes(req.params.id)) {
   const shortURL = req.params.id;
   urlDB[shortURL].longURL = req.body.newURL;
   res.redirect('/urls');
 } else {
   res.status(401).send("This is not your URL. Sign into associated account to edit this URL.")
 }
});

//================ DELETE =================//

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = usersURLs(userID, urlDB);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDB[shortURL];
    red.redirect('/urls');
  } else {
    res.status(401).send("This is not your URL. Sign into associated account to delete this URL.")
  }
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