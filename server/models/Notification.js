import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    type: { type: String, enum: ['inactive_30days', 'scheduled_deletion'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('Notification', notificationSchema)
