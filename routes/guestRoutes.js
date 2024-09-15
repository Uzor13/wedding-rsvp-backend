const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');

router.post('/rsvp/:uniqueId', guestController.handleRsvp);
router.get('/guest/:uniqueId', guestController.getGuestInfo);

module.exports = router;
