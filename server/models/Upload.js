import mongoose from 'mongoose'

const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaderName: { type: String, required: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  },
  { timestamps: true }
)

export default mongoose.model('Upload', uploadSchema)
