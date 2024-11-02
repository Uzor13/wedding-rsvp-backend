const express = require('express');
const router = express.Router();
const {
    getAllTags,
    createTag,
    assignUsersToTag,
    getUntaggedUsers
} = require('../controllers/tagController');

// Tag routes
router.get('/', getAllTags);
router.post('/', createTag);
router.post('/:tagId/users', assignUsersToTag);
router.get('/:tagId/untagged-users', getUntaggedUsers);

module.exports = router;