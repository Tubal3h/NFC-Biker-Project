// in backend/src/models/medical-profile.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emergencyContactSchema = new Schema({
    name: { type: String },
    relation: { type: String },
    phone: { type: String }
}, { _id: false });

const medicalProfileSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    profileName: {
        type: String,
        required: true,
        default: 'Profilo Principale'
    },
    bloodType: { type: String, default: null },
    allergies: { type: String, default: '' },
    conditions: { type: String, default: '' },
    notes: { type: String, default: '' },
    emergencyContacts: [emergencyContactSchema]
    
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret._id;
            delete ret.__v;
        }
    }
});

medicalProfileSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

const MedicalProfile = mongoose.model('MedicalProfile', medicalProfileSchema);

module.exports = MedicalProfile;