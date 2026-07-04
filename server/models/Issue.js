import mongoose from 'mongoose'

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
  },
  { _id: false }
)

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'potholes_and_road_damage',
        'traffic_signal_malfunction',
        'non_functional_streetlights',
        'water_leakage',
        'garbage_overflow',
        'drainage_blockage',
        'public_toilet_issue',
        'tree_trimming',
        'building_safety',
        'streetlight_failure',
        'other',
      ],
      required: true,
    },
    severity: { type: Number, min: 1, max: 5, required: true },
    status: {
      type: String,
      enum: ['reported', 'in_progress', 'resolved'],
      default: 'reported',
    },
    location: { type: locationSchema, required: true },
    geoLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    area: { type: String, default: 'Unknown Area' },
    imageUrl: String,
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporterName: { type: String, required: true },
    reporterTrustScore: { type: Number, default: 50 },
    reportCount: { type: Number, default: 1 },
    clusterId: String,
    priorityScore: { type: Number, default: 0 },
    validationResult: {
      type: String,
      enum: ['valid', 'suspicious', 'manipulated', 'pending'],
      default: 'pending',
    },
    assignedTo: String,
    responsibleDepartment: { type: String, default: 'General Municipal Services' },
    votes: { type: Number, default: 1 },
    voterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    timeline: [
      {
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        performedBy: String,
        details: String,
      },
    ],
    lastActionAt: { type: Date, default: Date.now },
    inactiveNotificationSent: { type: Boolean, default: false },
    scheduledForDeletion: { type: Boolean, default: false },
  },
  { timestamps: true }
)

issueSchema.index({ geoLocation: '2dsphere' })
issueSchema.index({ priorityScore: -1 })

issueSchema.pre('validate', function setGeo(next) {
  if (this.location?.lat != null && this.location?.lng != null) {
    this.geoLocation = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat],
    }
  }
  next()
})

export default mongoose.model('Issue', issueSchema)
