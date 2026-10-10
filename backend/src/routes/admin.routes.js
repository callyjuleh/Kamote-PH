'use strict';

const router = require('express').Router();
const { reviewLicense } = require('../controllers/features.controllers');

router.post('/users/:id/license', reviewLicense);

module.exports = router;
