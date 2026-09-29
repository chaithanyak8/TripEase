import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  bookId: {
    type: String,
    default: null
  },
  bookTitle: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

export default ActivityLog;
