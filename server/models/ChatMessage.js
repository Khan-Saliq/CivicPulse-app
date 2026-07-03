import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin'], required: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    message: { type: String, required: true },
    response: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('ChatMessage', chatMessageSchema)
