import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const CabBookingForm = () => {
    const { createBooking, loading, error, lastBooking } = useBooking();
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

            <div className="max-w-2xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                        Travel Smart.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Travel in Style.</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium">Premium cab service at your fingertips.</p>
                </div>

                {/* Main Glass Card */}
                <div className="glass-card rounded-3xl shadow-2xl overflow-hidden hover:shadow-indigo-500/20 transition-all duration-500">
                    
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 overflow-x-auto">
                        {['ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'HOURLY'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 px-4 text-center text-sm font-bold whitespace-nowrap rounded-xl transition-all duration-300 ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
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
                                        value={formData.pickup.address}
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
                                        value={formData.dropoff.address}
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
                                    value={formData.schedule.pickupDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-medium appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Pick-Up Time</label>
                                <input 
                                    type="time" 
                                    name="pickupTime"
                                    value={formData.schedule.pickupTime}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-medium appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? 'Processing...' : 'Book Ride'}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
                        )}
                        {lastBooking && (
                            <p className="mt-4 text-sm font-medium text-emerald-700">
                                Booking confirmed. Fare: ₹${lastBooking.fare?.totalAmount}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CabBookingForm;
