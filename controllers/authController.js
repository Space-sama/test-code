const User = require("../models/User.model");
const History = require("../models/History.model");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { parseString } = require('xml2js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'secret id', {
    expiresIn: maxAge
  });
};

// handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', password: '' };
  
    // duplicate email error
    if (err.code === 11000) {
      errors.email = 'cet email est déjà enregistré dans la base de données..';
      return errors;
    }
  
    // validation errors
    if (err.message.includes('user validation failed')) {
      // console.log(err);
      Object.values(err.errors).forEach(({ properties }) => {
        // console.log(val);
        // console.log(properties);
        errors[properties.path] = properties.message;
      });
    }

    // incorrect email
    if (err.message === 'Email incorrect') {
      errors.email = 'Cet email n\'existe pas dans la base de données..';
    }

    // incorrect password
    if (err.message === 'Mot de passe incorrect') {
      errors.password = 'Mot de passe est incorrect..';
    }

    // duplicate email error
    if (err.code === 11000) {
      errors.email = 'that email is already registered';
      return errors;
    }
  
    return errors;
}
  





// get login page
module.exports.login_get = (req, res) => {
    res.render('login', { csrfToken: req.csrfToken() });
}

// login acess
module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

 
// create new account
module.exports.signup_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.create({ email, password });
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id});
    }
    catch(err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
   
  }

// get sign up page 
module.exports.signup_get = (req, res) => {
    // res.render('signup');
    res.render('signup', { csrfToken: req.csrfToken() });
}

// histo
module.exports.histo = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    // check json web token exists & is verified
    if (token) {
      jwt.verify(token, 'secret id', (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.redirect('/login');
        } else {
          console.log(decodedToken);
        }
      });
    } else {
      res.redirect('/login');
    }
    const histories = await History.find().sort({ date: 'desc' });
    console.log("hestos ", histories);
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // console.log("---------- IP ", ip);
    res.render('histories.ejs', { histories, csrfToken: req.csrfToken() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// signs
module.exports.signs = async (req, res) => {
  const token = req.cookies.jwt;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, 'secret id', (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else {
        console.log(decodedToken);
      }
    });
  } else {
    res.redirect('/login');
  }
  const apiUrl = 'https://dev.dematpro.net/websuivi/api_v3?action=getContratMultipleList&PageLength=100&login=admin_robot_pegaseexpert&pwd=230915';
  const response = await axios.post(apiUrl, {
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
      },
  });
  // Convertir la réponse XML en JSON
  let jsonData;
  await parseString(response.data, (err, result) => {
      if (err) throw err;
      jsonData = result;
  });

  const apiData = jsonData.Responses.Contract;
  const contractsData = apiData.map(contract => {
      const contractData = {
          IdContrat: contract.IdContrat[0],
          State: contract.State[0],
          Filename: contract.Filename[0],
          TimestampCreation: contract.TimestampCreation[0],
          TimestampStatus: contract.TimestampStatus[0],
          Comment: contract.Comment[0],
          Signatories: [],
      };

      // Les Signataires
      const signatories = contract.Signatories[0].Signatory;
      signatories.forEach(signatory => {
          const signatoryData = {
              IdContratSignataire: signatory.IdContratSignataire[0],
              FirstName: signatory.FirstName[0],
              LastName: signatory.LastName[0],
              Email: signatory.Email[0],
              CellPhone: signatory.CellPhone[0],
              IdentType: signatory.IdentType[0],
              IdentCode: signatory.IdentCode[0],
              ModeSecure: signatory.ModeSecure[0],
              Status: signatory.Status[0],
              StatusTimestamp: signatory.StatusTimestamp[0],
              RefusalComment: signatory.RefusalComment[0],
              UUIDLink: signatory.UUIDLink[0],
          };

          contractData.Signatories.push(signatoryData);
      });

      return contractData;
  });

  // console.log("Result-------", contractsData);
  res.render('signatures.ejs', { contracts: contractsData });
}

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
}
  
