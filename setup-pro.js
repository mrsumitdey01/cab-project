const fs = require('fs');
const path = require('path');

// --- Configuration ---
const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

console.log(`🚀 Generating Industry-Grade Project with Tailwind UI...`);

// --- Helper Functions ---
function createFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created: ${path.relative(__dirname, filePath)}`);
}

// --- 1. SERVER SETUP (Express + MongoDB) ---

// Server Package.json
createFile(path.join(serverDir, 'package.json'), JSON.stringify({
  "name": "cab-server-pro",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js", "dev": "nodemon server.js" },
  "dependencies": {
    "express": "^4.18.2", "mongoose": "^7.0.0", "dotenv": "^16.0.3", 
    "cors": "^2.8.5", "helmet": "^6.0.1", "morgan": "^1.10.0"
  }
}, null, 2));

// Server .env
createFile(path.join(serverDir, '.env'), `PORT=5000\nMONGO_URI=mongodb://localhost:27017/cabrental\nCLIENT_URL=http://localhost:3000`);

// Server Code (server.js)
createFile(path.join(serverDir, 'server.js'), 
`require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

app.use('/api/bookings', require('./routes/bookingRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`🚀 Server running on \${PORT}\`));`);

// Booking Model
createFile(path.join(serverDir, 'models', 'Booking.js'), 
`const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
    tripType: { type: String, enum: ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'], required: true },
    pickup: { address: String, coordinates: { lat: Number, lng: Number } },
    dropoff: { address: String, coordinates: { lat: Number, lng: Number } },
    schedule: { pickupDate: Date, pickupTime: String },
    fare: { totalAmount: Number },
    status: { type: String, default: 'PENDING' }
}, { timestamps: true });
module.exports = mongoose.model('Booking', bookingSchema);`);

// Routes
createFile(path.join(serverDir, 'routes', 'bookingRoutes.js'), 
`const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

router.post('/', async (req, res) => {
    try {
        const { pickup, dropoff, tripType, schedule } = req.body;
        const fare = 100 + Math.floor(Math.random() * 500); // Mock Fare
        const booking = new Booking({ tripType, pickup, dropoff, schedule, fare: { totalAmount: fare } });
        await booking.save();
        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;`);


// --- 2. CLIENT SETUP (React + Tailwind CSS) ---

// Client Package.json (Includes Tailwind)
createFile(path.join(clientDir, 'package.json'), JSON.stringify({
  "name": "cab-client-pro",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0", "react-dom": "^18.2.0", "react-scripts": "5.0.1", 
    "axios": "^1.4.0", "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0", "autoprefixer": "^10.4.14", "postcss": "^8.4.21"
  },
  "scripts": { "start": "react-scripts start", "build": "react-scripts build" }
}, null, 2));

// Tailwind Config (CRITICAL FOR DESIGN)
createFile(path.join(clientDir, 'tailwind.config.js'), 
`/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
      animation: { 'float': 'float 6s ease-in-out infinite' },
      keyframes: { float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } } }
    }
  },
  plugins: [],
};`);

// PostCSS Config
createFile(path.join(clientDir, 'postcss.config.js'), `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`);

// CSS File (Inject Tailwind)
createFile(path.join(clientDir, 'src', 'index.css'), 
`@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Advanced Styles */
body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F0F4FF; }
.mesh-gradient {
    background-color: #ffffff;
    background-image: 
        radial-gradient(at 40% 20%, hsl(220, 100%, 95%) 0px, transparent 50%),
        radial-gradient(at 80% 0%, hsl(210, 100%, 85%) 0px, transparent 50%),
        radial-gradient(at 0% 50%, hsl(240, 100%, 90%) 0px, transparent 50%);
}
.glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
}
.shape-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.6;
    z-index: -1;
}
.input-glow:focus {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    border-color: #2563EB;
}`);

// HTML Template
createFile(path.join(clientDir, 'public', 'index.html'), 
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RideEasy Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`);

// React Context
createFile(path.join(clientDir, 'src', 'context', 'BookingContext.js'), 
`import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
const BookingContext = createContext();
export const useBooking = () => useContext(BookingContext);
export const BookingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const createBooking = async (data) => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/bookings', data);
            alert(\`Booking Confirmed! Fare: $\${res.data.data.fare.totalAmount}\`);
            return res.data;
        } catch (err) { alert('Booking failed. Ensure server is running.'); }
        finally { setLoading(false); }
    };
    return <BookingContext.Provider value={{ createBooking, loading }}>{children}</BookingContext.Provider>;
};`);

// --- THE MODERN UI COMPONENT (CabBookingForm.jsx) ---
createFile(path.join(clientDir, 'src', 'components', 'CabBookingForm.jsx'), 
`import React, { useState, useContext } from 'react';
import { useBooking } from '../context/BookingContext';

const CabBookingForm = () => {
    const { createBooking, loading } = useBooking();
    const [activeTab, setActiveTab] = useState('ONE_WAY');
    const [formData, setFormData] = useState({
        pickup: { address: '' },
        dropoff: { address: '' },
        schedule: { pickupDate: '', pickupTime: '' }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pickup' || name === 'dropoff') {
            setFormData(prev => ({ ...prev, [name]: { address: value } }));
        } else {
            setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, [name]: value } }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createBooking({ ...formData, tripType: activeTab });
    };

    return (
        <div className="min-h-screen mesh-gradient text-slate-800 antialiased p-4 md:p-8 relative overflow-hidden">
            {/* Decorative Blobs */}
            <div className="shape-blob w-96 h-96 bg-blue-400 top-0 left-0 fixed animate-float"></div>
            <div className="shape-blob w-80 h-80 bg-indigo-300 bottom-0 right-0 fixed animate-float" style={{animationDelay: '2s'}}></div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                        Travel Smart.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Travel in Style.</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium">Premium cab service at your fingertips.</p>
                </div>

                {/* Main Glass Card */}
                <div className="glass-card rounded-3xl shadow-2xl overflow-hidden hover:shadow-blue-200/50 transition-all duration-500">
                    
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 overflow-x-auto">
                        {['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={\`flex-1 py-3 px-4 text-center text-sm font-bold whitespace-nowrap rounded-xl transition-all duration-300 \${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}\`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-6 md:p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative">
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">From</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></span>
                                    <input 
                                        type="text" 
                                        name="pickup"
                                        placeholder="Enter Pickup Location" 
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:outline-none input-glow transition"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">To</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
                                    <input 
                                        type="text" 
                                        name="dropoff"
                                        placeholder="Enter Drop Location" 
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:outline-none input-glow transition"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Pick-Up Date</label>
                                <input 
                                    type="date" 
                                    name="pickupDate"
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:outline-none input-glow transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Pick-Up Time</label>
                                <input 
                                    type="time" 
                                    name="pickupTime"
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:outline-none input-glow transition"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? 'Processing...' : 'Book Ride'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CabBookingForm;`);

// App.js and Index.js
createFile(path.join(clientDir, 'src', 'App.js'), 
`import React from 'react';
import { BookingProvider } from './context/BookingContext';
import CabBookingForm from './components/CabBookingForm';
import './index.css';

function App() {
  return (
    <BookingProvider>
      <CabBookingForm />
    </BookingProvider>
  );
}
export default App;`);

createFile(path.join(clientDir, 'src', 'index.js'), 
`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);`);

console.log("\n✅ Project Generation Complete!");
console.log("------------------------------------------------");
console.log("👉 NEXT STEPS TO RUN THE APP:");
console.log("1. cd server && npm install && npm run dev");
console.log("2. (New Terminal) cd client && npm install && npm start");
console.log("------------------------------------------------");