const mongoose = require('mongoose');

const InspectionTaskSchema = new mongoose.Schema({
  inspectionDriveId: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionDrive', required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  subsiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subsite', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  checklistResults: [{
    question: String,
    checked: { type: Boolean, default: false }
  }],
  remarks: { type: String },
  uploadedImages: [{ type: String }],
  issueFound: { type: Boolean, default: false },
  linkedIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InspectionTask', InspectionTaskSchema);
