const mongoose = require('mongoose');

const InspectionDriveSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  inspectionType: { 
    type: String, 
    required: true,
    enum: [
      'Daily Safety Inspection',
      'Weekly Compliance Audit',
      'Fire Safety Inspection',
      'Electrical Inspection',
      'Equipment Inspection'
    ]
  },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedInspectors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InspectionDrive', InspectionDriveSchema);
