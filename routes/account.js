/**
 * Account route handler
 */

const express = require('express');
const sql = require('mssql');
const config = require('config');
const {
  body,
  validationResult,
} = require('express-validator');
const jwt = require('jsonwebtoken');

const router = express.Router();

sql.on('error', err => {
  console.log(err);
});

router.post('/register', [
  body('username')
    .not().isEmpty().withMessage('Username cannot be empty')
    .isLength({
      min: 4, max: 16,
    }).withMessage('Username can contain min 4 and max 16 characters')
    .trim()
    .escape()
    .custom(value => {
      if (!/^[a-zA-Z0-9]+$/.test(value)) {
        return Promise.reject('Username cannot contain special characters');
      }
      return sql.connect(config.get('database')).then(pool => {
        return pool.request()
          .input('username', sql.VarChar, value)
          .query('SELECT TOP 1 UserNum FROM Account.dbo.cabal_auth_table WHERE ID = @username');
      }).then(result => {
        if (result.recordset && result.recordset.length !== 0) {
          return Promise.reject('Username has already been taken');
        }
        return true;
      });
    }),
  body('email')
    .not().isEmpty().withMessage('Email address cannot be empty')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .custom(value => {
      return sql.connect(config.get('database')).then(pool => {
        return pool.request()
          .input('email', sql.VarChar, value)
          .query('SELECT TOP 1 UserNum FROM Account.dbo.cabal_auth_table WHERE Email = @email');
      }).then(result => {
        if (result.recordset && result.recordset.length !== 0) {
          return Promise.reject('Email has already been used');
        }
        return true;
      });
    }),
  body('password')
    .not().isEmpty().withMessage('Password cannot be empty'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  sql.connect(config.get('database')).then(pool => {
    return pool.request()
      .input('id', sql.VarChar, req.body.username)
      .input('password', sql.VarChar, req.body.password)
      .input('email', sql.VarChar, req.body.email)
      .input('question', sql.VarChar, 'Who are you?')
      .input('answer', sql.VarChar, 'Cabal player')
      .input('ip', sql.VarChar, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
      .execute('Account.dbo.cabal_tool_registerAccount_web');
  }).then(result => {
    if (result.recordset && result.recordset.length !== 0) {
      res.status(201).json({
        msg: 'Account was successfully created',
      });
    } else {
      res.status(500).json({
        errors: [{
          msg: 'Account could not be created',
        }],
      });
    }
  }).catch(next);
});

router.post('/login', [
  body('username')
    .not().isEmpty().withMessage('Username cannot be empty')
    .trim()
    .escape(),
  body('password')
    .not().isEmpty().withMessage('Password cannot be empty'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  sql.connect(config.get('database')).then(pool => {
    return pool.request()
      .input('username', sql.VarChar, req.body.username)
      .input('password', sql.VarChar, req.body.password)
      .query('SELECT TOP 1 UserNum, ID, Email FROM Account.dbo.cabal_auth_table WHERE ID = @username AND PWDCOMPARE(@password, password) = 1');
  }).then(result => {
    if (result.recordset && result.recordset.length !== 0) {
      res.json({
        user: result.recordset[0],
        msg: 'Login was successful',
        token: jwt.sign(result.recordset[0], config.get('jwt.secret'), { expiresIn: config.get('jwt.expiry') }),
      });
    } else {
      res.status(401).json({
        errors: [{
          msg: 'Username or password is incorrect',
        }],
      });
    }
  }).catch(next);
});

module.exports = router;
