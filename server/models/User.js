import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin', 'department_admin'], default: 'citizen' },
    department: { type: String, default: null },
    trustScore: { type: Number, default: 50 },
    verifiedReports: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
