const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { PORT, MONGO_URI } = require('./config');
const adminRoutes = require('./routes/adminRoutes');
const guestRoutes = require('./routes/guestRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to the DB...'))
    .catch(err => console.log(err));

app.use('/api/admin', adminRoutes);
app.use('/api', guestRoutes);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;
