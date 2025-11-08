const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { PORT, MONGO_URI } = require('./config');
const adminRoutes = require('./routes/adminRoutes');
const guestRoutes = require('./routes/guestRoutes');
const tagController = require('./controllers/tagController');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors());
app.use(cors(corsOptions));
app.use(bodyParser.json());

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to the DB...'))
    .catch(err => console.log(err));

app.use('/api/admin', adminRoutes);
app.use('/api', guestRoutes);
app.use('/api/tags', tagController);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;
