const express = require('express');
const router = express.Router();
const Tag = require('../models/tagModel');
const Guest = require('../models/guestModel');
const {authenticate, authorize} = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorize('admin', 'couple'));

const resolveCoupleId = (req, source = 'query') => {
    if (req.auth?.role === 'couple') {
        return req.auth.coupleId;
    }
    if (source === 'body') {
        return req.body.coupleId || req.query.coupleId;
    }
    if (source === 'params') {
        return req.params.coupleId || req.query.coupleId;
    }
    return req.query.coupleId;
};

router.get('/', async (req, res) => {
    try {
        const coupleId = resolveCoupleId(req);
        const filter = coupleId ? {couple: coupleId} : {};
        const tags = await Tag.find(filter).populate('users', 'name phoneNumber');
        res.json(tags);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

router.post('/', async (req, res) => {
    try {
        const {name, coupleId: bodyCoupleId} = req.body;
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : bodyCoupleId;
        if (!name || !coupleId) {
            return res.status(400).json({message: 'Name and coupleId are required'});
        }

        const existingTag = await Tag.findOne({name, couple: coupleId});
        if (existingTag) {
            return res.status(400).json({message: 'Tag already exists'});
        }

        const tag = await Tag.create({name, couple: coupleId});
        res.status(201).json(tag);
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const coupleId = resolveCoupleId(req);
        const filter = {_id: req.params.id};
        if (coupleId) {
            filter.couple = coupleId;
        }

        const tag = await Tag.findOneAndDelete(filter);
        if (!tag) {
            return res.status(404).json({message: 'Tag not found'});
        }
        res.json({message: 'Tag deleted'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

router.post('/:id/users', async (req, res) => {
    try {
        const {userIds = []} = req.body;
        const coupleId = resolveCoupleId(req, 'body');

        const tag = await Tag.findOne({_id: req.params.id, ...(coupleId ? {couple: coupleId} : {})});
        if (!tag) {
            return res.status(404).json({message: 'Tag not found'});
        }

        const guests = await Guest.find({_id: {$in: userIds}, couple: tag.couple});
        if (guests.length !== userIds.length) {
            return res.status(400).json({message: 'Some users not found for this couple'});
        }

        await Tag.findByIdAndUpdate(
            tag._id,
            {$addToSet: {users: {$each: userIds}}},
            {new: true}
        );

        await Guest.updateMany(
            {_id: {$in: userIds}},
            {$addToSet: {tags: tag._id}}
        );

        const updated = await Tag.findById(tag._id).populate('users', 'name phoneNumber');

        res.json(updated);
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

router.delete('/:tagId/users/:userId', async (req, res) => {
    try {
        const coupleId = resolveCoupleId(req, 'params');
        const filter = {_id: req.params.tagId};
        if (coupleId) {
            filter.couple = coupleId;
        }

        const tag = await Tag.findOne(filter);
        if (!tag) {
            return res.status(404).json({message: 'Tag not found'});
        }

        await Tag.findByIdAndUpdate(tag._id, {$pull: {users: req.params.userId}});
        await Guest.findByIdAndUpdate(req.params.userId, {$pull: {tags: tag._id}});
        const updated = await Tag.findById(tag._id).populate('users', 'name phoneNumber');
        res.json(updated);
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const coupleId = resolveCoupleId(req, 'params');
        const filter = {users: req.params.userId};
        if (coupleId) {
            filter.couple = coupleId;
        }

        const tag = await Tag.findOne(filter);
        if (!tag) {
            return res.status(404).json({error: 'No tag found for this user'});
        }
        res.json(tag);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

router.put('/reassign', async (req, res) => {
    const {userId, newTagId, coupleId: bodyCoupleId} = req.body;

    try {
        if (!userId || !newTagId) {
            return res.status(400).json({message: 'Missing required fields'});
        }

        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : bodyCoupleId;
        const newTag = await Tag.findOne({_id: newTagId, ...(coupleId ? {couple: coupleId} : {})});
        if (!newTag) {
            return res.status(404).json({message: 'New tag not found'});
        }

        const currentTag = await Tag.findOne({users: userId, couple: newTag.couple});

        if (currentTag && currentTag._id.equals(newTag._id)) {
            return res.json({message: 'User already assigned to this tag'});
        }

        const session = await Tag.startSession();
        try {
            await session.withTransaction(async () => {
                if (currentTag) {
                    await Tag.findByIdAndUpdate(
                        currentTag._id,
                        {$pull: {users: userId}},
                        {session}
                    );
                }

                await Tag.findByIdAndUpdate(
                    newTag._id,
                    {$addToSet: {users: userId}},
                    {session}
                );

                await Guest.findByIdAndUpdate(
                    userId,
                    {
                        $set: {tags: [newTag._id]}
                    },
                    {session}
                );
            });
            await session.endSession();
            res.json({message: 'User reassigned successfully'});
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            res.status(500).json({message: error.message});
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

module.exports = router;
