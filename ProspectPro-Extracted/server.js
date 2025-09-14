const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const businessDiscoveryRoutes = require('./api/business-discovery');
const emailDiscoveryRoutes = require('./api/email-discovery');
const validationRoutes = require('./api/validation');
const exportRoutes = require('./api/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// API Routes
app.use('/api/business', businessDiscoveryRoutes);
app.use('/api/email', emailDiscoveryRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/export', exportRoutes);

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        apis: {
            googlePlaces: !!process.env.GOOGLE_PLACES_API_KEY,
            scrapingdog: !!process.env.SCRAPINGDOG_API_KEY,
            hunter: !!process.env.HUNTER_IO_API_KEY,
            neverbounce: !!process.env.NEVERBOUNCE_API_KEY
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 ProspectPro Real API Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
});