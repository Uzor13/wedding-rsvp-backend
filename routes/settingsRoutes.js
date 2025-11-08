const express = require('express');
const {authenticate, authorize} = require('../middleware/authMiddleware');
const {getSettings, updateSettings, getPublicSettings} = require('../controllers/settingsController');

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'couple'), getSettings);
router.put('/', authenticate, authorize('admin', 'couple'), updateSettings);
router.get('/public', getPublicSettings);

module.exports = router;

