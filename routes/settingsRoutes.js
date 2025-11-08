const express = require('express');
const {verifyAdmin} = require('../middleware/authMiddleware');
const {getSettings, updateSettings, getPublicSettings} = require('../controllers/settingsController');

const router = express.Router();

router.get('/', verifyAdmin, getSettings);
router.put('/', verifyAdmin, updateSettings);
router.get('/public', getPublicSettings);

module.exports = router;

