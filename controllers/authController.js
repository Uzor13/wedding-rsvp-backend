const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {SECRET_KEY} = require('../config');
const Couple = require('../models/coupleModel');
const Settings = require('../models/settingsModel');

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

const loginAdmin = (req, res) => {
    const {username, password} = req.body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign({role: 'admin'}, SECRET_KEY, {expiresIn: '4h'});
        return res.json({token, role: 'admin'});
    }

    return res.status(401).json({message: 'Invalid credentials'});
};

const generateCredentials = (name) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = crypto.randomBytes(2).toString('hex');
    const username = `${base || 'couple'}${suffix}`;
    const password = crypto.randomBytes(4).toString('hex');
    return {username, password};
};

const createCouple = async (req, res) => {
    try {
        const {name, email} = req.body;
        if (!name) {
            return res.status(400).json({message: 'Name is required'});
        }

        const {username, password} = generateCredentials(name);
        const hash = await bcrypt.hash(password, 10);

        const couple = await Couple.create({
            name,
            email,
            username,
            password: hash
        });

        await Settings.findOneAndUpdate(
            {couple: couple._id},
            {$setOnInsert: {couple: couple._id}},
            {upsert: true, new: true}
        );

        res.status(201).json({
            couple: {
                _id: couple._id,
                name: couple.name,
                email: couple.email,
                username: couple.username,
                createdAt: couple.createdAt
            },
            credentials: {username, password}
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({message: 'Couple already exists'});
        }
        res.status(500).json({message: error.message});
    }
};

const listCouples = async (req, res) => {
    try {
        const couples = await Couple.find().select('-password').sort({createdAt: -1});
        res.json(couples);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const loginCouple = async (req, res) => {
    try {
        const {username, password} = req.body;
        const couple = await Couple.findOne({username});
        if (!couple) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const match = await bcrypt.compare(password, couple.password);
        if (!match) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const token = jwt.sign({role: 'couple', coupleId: couple._id}, SECRET_KEY, {expiresIn: '4h'});
        res.json({
            token,
            role: 'couple',
            couple: {
                id: couple._id,
                name: couple.name,
                email: couple.email,
                eventTitle: couple.eventTitle
            }
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    loginAdmin,
    createCouple,
    listCouples,
    loginCouple
};
