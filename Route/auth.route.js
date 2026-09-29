const express = require('express');

const { login, register } = require('../Controller/auth.controller');
const { validateRegistration } = require('../middleware/validation.middleware');

const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/login', login);

module.exports = router;
