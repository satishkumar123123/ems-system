require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Modular Routes Import
const widerRoutes = require('./routes/widerRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const hsuRoutes = require('./routes/hsuRoutes');
const narrowFlatRoutes = require('./routes/narrowFlatRoutes');
const narrowTubeRoutes = require('./routes/narrowTubeRoutes');
const abplRoutes = require('./routes/abplRoutes');
const solarRoutes = require('./routes/solarRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Cloud Atlas MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ems_db';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB Atlas Connected Successfully!'))
.catch(err => console.error('❌ MongoDB Atlas Connection Error:', err.message));

// Connection Event Monitoring
mongoose.connection.on('connected', () => console.log('Mongoose event: Connected to Atlas'));
mongoose.connection.on('error', (err) => console.error('Mongoose event error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose event: Disconnected from Atlas'));

// ==========================================
// ROUTES MIDDLEWARE
// ==========================================
app.use('/api/abpl', abplRoutes);
app.use('/api/wider', widerRoutes);
app.use('/api/utility', utilityRoutes);
app.use('/api/hsu', hsuRoutes);
app.use('/api/narrow-flat', narrowFlatRoutes);
app.use('/api/narrow-tube', narrowTubeRoutes);
app.use('/api/solar', solarRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('EMS Backend Server is Running.');
});

// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 EMS Backend running on http://localhost:${PORT}`));