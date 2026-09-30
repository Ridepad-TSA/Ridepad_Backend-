const express = require('express');

const { getHealth } = require('../Controller/healthController');

const router = express.Router();

router.get('/', getHealth);

module.exports = router;
