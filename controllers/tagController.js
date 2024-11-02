const express = require('express');
const router = express.Router();
const Tag = require('../models/tagModel');
const User = require('../models/guestModel'); // Assuming you already have this

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().populate('users', 'name email');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new tag
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    const tag = new Tag({ name });
    const savedTag = await tag.save();
    res.status(201).json(savedTag);
  } catch (error) {
    res.status(400).json({ message: error.message });
    console.log(error)
  }
});

// Delete a tag
router.delete('/:id', async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign users to a tag
router.post('/:id/users', async (req, res) => {
  try {
    const { userIds } = req.body;
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Verify all users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({ message: 'Some users not found' });
    }

    // Add users to tag
    tag.users = [...new Set([...tag.users, ...userIds])];
    await tag.save();

    const updatedTag = await Tag.findById(req.params.id).populate('users', 'name email');
    res.json(updatedTag);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove user from tag
router.delete('/:tagId/users/:userId', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.tagId);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    tag.users = tag.users.filter(userId =>
        userId.toString() !== req.params.userId
    );
    await tag.save();

    res.json(tag);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;