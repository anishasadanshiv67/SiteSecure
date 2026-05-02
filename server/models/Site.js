const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a site name'],
    trim: true,
    unique: true
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
    required: [true, 'Please upload a site map image']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Site', SiteSchema);
