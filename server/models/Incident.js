const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Please select severity level']
  },
  status: {
    type: String,
    enum: ['reported', 'approved', 'rejected', 'verified', 'resolved', 'compliance_review', 'closed'],
    default: 'reported'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  siteId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Site',
    required: true
  },
  subsiteId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subsite'
  },
  location: {
    address: String,
    lat: Number,
    lng: Number,
    x: Number,
    y: Number
  },
  images: [String],
  resolution: {
    notes: String,
    images: [String],
    resolvedAt: Date
  },
  complianceReview: {
    notes: String,
    reviewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  },
  closedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Incident', IncidentSchema);
