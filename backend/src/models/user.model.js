// in backend/src/models/user.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Gli schemi 'emergencyContactSchema' e 'medicalDataSchema' sono stati rimossi 
// perché non erano utilizzati e i loro dati sono ora gestiti da 'medical-profile.model.js'.

const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    // --- CAMPI AGGIUNTI PER LA VERIFICA ---
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    // --- FINE AGGIUNTE ---
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    premium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
    mainProfileId: { type: Schema.Types.ObjectId, ref: 'MedicalProfile', default: null },
    nfcTags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }]
}, {
    timestamps: true,
    toJSON: { virtuals: true, transform: function(doc, ret) { delete ret._id; delete ret.__v; } },
    toObject: { virtuals: true, transform: function(doc, ret) { delete ret._id; delete ret.__v; } }
});

userSchema.virtual('id').get(function() { return this._id.toHexString(); });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);