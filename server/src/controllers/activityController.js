import ActivityLog from '../models/ActivityLog.js';

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
