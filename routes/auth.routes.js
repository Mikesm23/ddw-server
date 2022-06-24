// User Routes

const router = require("express").Router();
const User = require("../models/User.model")
const bcryptjs = require('bcryptjs')
const express = require("express");
const jwt = require("jsonwebtoken");

const { isAuthenticated } = require('./../middleware/jwt.middleware.js');
const saltRounds = 10


/* Sign Up/Create User Route (post) */
router.post("/signup", (req, res) => {
    console.log ("serverside-recieving (signup): ", req.body) 
  const { email, password, username } = req.body;
  if (email === '' || password === '' || username === '') {
    res.status(400).json({ message: "Provide email, password and name" });
    return;
}
  // this does not work:
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // if (!emailRegex.test(email)) {
  //   res.status(400).json({ message: 'Provide a valid email address.' });
  //   return;
  // }
  
   // this does not work:
  // const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  // if (!passwordRegex.test(password)) {
  //   res.status(400).json({ message: 'Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.' });
  //   return;
  // }
 
  User.findOne({ email })
    .then((foundUser) => {
      console.log('Were inside!')
      if (foundUser) {
        res.status(400).json({ message: "User already exists." });
        return;
      }
 
      const salt = bcryptjs.genSaltSync(saltRounds);
      const hashedPassword = bcryptjs.hashSync(password, salt);
      return User.create({ email, password: hashedPassword, username });
    })
    .then((createdUser) => {
        const { email, username, _id } = createdUser;
        const user = { email, username, _id };
        res.status(201).json({ user: user });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" })
    });
});
 

// -------------------  LOGIN ---------------------- \\
// POST  /auth/login - Verifies email and password and returns a JWT
router.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  
  if (email === '' || password === '') {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }
 
  User.findOne({ email })
    .then((foundUser) => {
    
      if (!foundUser) {
        res.status(401).json({ message: "User not found." })
        return;
      }
 
      const passwordCorrect = bcryptjs.compareSync(password, foundUser.password);
 
      if (passwordCorrect) {
        const { _id, email, username } = foundUser;
        
        const payload = { _id, email, username };
        const authToken = jwt.sign( 
          payload,
          process.env.TOKEN_SECRET,
          { algorithm: 'HS256', expiresIn: "6h" }
        );
        res.status(200).json({ authToken: authToken });
        
      }
      else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
 
    })
    .catch(err =>  {
      console.log(err)
      res.status(500).json({ message: err })});
});

// GET  /auth/verify  -  Used to verify JWT stored on the client

router.get('/verify', isAuthenticated, (req, res, next) => {    
  console.log(`req.payload`, req.payload);
  res.status(200).json(req.payload);
});







// -------------------  LOGOUT ---------------------- \\
// router.post('/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) next(err);
//     res.redirect('/');
//   });
// });



/* Delete User Route (delete) */

// router.post('/auth/:id', (req, res) => {
//     console.log("CHECK HERE PARAMS ----->", req.params)
//     User.findByIdAndDelete(req.params.id)
//     // no redirect due to using React
//   });

  module.exports = router;