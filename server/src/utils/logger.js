import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ userId = null, email = null, action, bookId = null, bookTitle = null, metadata = {} }) => {
  try {
    const log = new ActivityLog({
      userId: userId ? String(userId) : null,
      email,
      action,
      bookId: bookId ? String(bookId) : null,
      bookTitle,
      metadata
    });
    await log.save();
  } catch (error) {
    console.error('Failed to save activity log to MongoDB:', error.message);
  }
};
