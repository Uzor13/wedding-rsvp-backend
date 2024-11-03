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

// Endpoint to get the tag for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const tag = await Tag.findOne({ users: req.params.userId });
    if (tag) {
      res.json(tag);
    } else {
      res.status(404).json({ error: 'No tag found for this user' });
    }
  } catch (error) {
    console.error('Error fetching tag for user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.put('/reassign', async (req, res) => {
  const { userId, newTagId } = req.body;

  try {
    // Input validation
    if (!userId || !newTagId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find both current and new tags
    const [currentTag, newTag] = await Promise.all([
      Tag.findOne({ "users._id": userId }),
      Tag.findById(newTagId)
    ]);

    if (!newTag) {
      return res.status(404).json({ message: 'New tag not found' });
    }

    // Start a session for the transaction
    const session = await Tag.startSession();

    try {
      await session.withTransaction(async () => {
        // Remove user from current tag if exists
        if (currentTag) {
          // Using filtered array instead of $pull to ensure proper removal
          const updatedUsers = currentTag.users.filter(
              user => user._id.toString() !== userId.toString()
          );

          await Tag.findByIdAndUpdate(
              currentTag._id,
              { $set: { users: updatedUsers } },
              { session }
          );
        }

        // Add user to new tag if not already present
        const userExists = newTag.users.some(
            user => user._id.toString() === userId.toString()
        );

        if (!userExists) {
          await Tag.findByIdAndUpdate(
              newTagId,
              { $addToSet: { users: { _id: userId } } },
              { session }
          );
        }
      });

      await session.commitTransaction();
      res.status(200).json({
        message: 'User reassigned successfully',
        from: currentTag ? currentTag._id : null,
        to: newTagId
      });
    } catch (error) {
      await session.abortTransaction();
      console.log(error);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Error in tag reassignment:', error);
    res.status(500).json({ message: 'Error reassigning user', error: error.message });
  }
});

module.exports = router;