const mongoose = require('mongoose');

const SubsiteSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Site',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a subsite name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  mapImage: {
    type: String,
    required: [true, 'Please upload a subsite map image']
  },
  qrCode: {
    type: String, // Base64 or URL
    required: true
  },
  coordinates: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subsite', SubsiteSchema);
