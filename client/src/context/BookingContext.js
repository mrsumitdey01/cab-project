import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastBooking, setLastBooking] = useState(null);

    const createBooking = async (data) => {
        setLoading(true);
        setError('');
        setLastBooking(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/bookings`, data);
            setLastBooking(res.data.data);
            return res.data;
        } catch (err) {
            const message =
                err?.response?.data?.error ||
                'Booking failed. Ensure server is running and payload is valid.';
            setError(message);
            setLastBooking(null);
            return null;
        }
        finally { setLoading(false); }
    };

    return (
        <BookingContext.Provider value={{ createBooking, loading, error, lastBooking }}>
            {children}
        </BookingContext.Provider>
    );
};
