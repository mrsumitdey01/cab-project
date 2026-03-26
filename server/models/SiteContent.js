const mongoose = require('mongoose');

const popularRouteSchema = new mongoose.Schema({
  from: { type: String, trim: true, required: true },
  to: { type: String, trim: true, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, trim: true, default: '' },
  icon: { type: String, trim: true, default: 'city' },
  blurb: { type: String, trim: true, default: '' },
}, { _id: true });

const linkSchema = new mongoose.Schema({
  label: { type: String, trim: true, required: true },
  to: { type: String, trim: true, required: true },
}, { _id: false });

const siteContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'primary' },
  heroVariant: {
    type: String,
    enum: ['classic', 'cinematic'],
    default: 'classic',
  },
  footer: {
    description: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },
    quickLinks: { type: [linkSchema], default: [] },
    legalLinks: { type: [linkSchema], default: [] },
  },
  popularRoutes: { type: [popularRouteSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
