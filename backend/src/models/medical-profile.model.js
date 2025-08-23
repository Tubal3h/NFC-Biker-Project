// in backend/src/models/medical-profile.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const medicalProfileSchema = new Schema({
    // A chi appartiene questo profilo?
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // --- CAMPO AGGIUNTO ---
    // Indica se il profilo è attivo. Verrà impostato su 'false' per i profili
    // secondari quando un account Premium torna a essere Gratuito.
    isActive: { type: Boolean, default: true },

    // Un nome per riconoscere il profilo (es. "Mio Profilo", "Profilo di Sara")
    profileName: {
        type: String,
        required: true,
        default: 'Profilo Principale'
    },
        // --- NUOVI CAMPI ANAGRAFICI ---
    name: { type: String, default: '' },
    surname: { type: String, default: '' },
    birthDate: { type: Date, default: null },
    birthPlace: { type: String, default: '' },
    residence: { type: String, default: '' },
    // -------------------------------
    
    // photoUrl: { type: String, default: null },
    // I dati medici veri e propri
    bloodType: { type: String, default: null },
    allergies: { type: String, default: '' },
    conditions: { type: String, default: '' },
    notes: { type: String, default: '' },
    emergencyContacts: [{
        name: { type: String },
        relation: { type: String },
        phone: { type: String }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true, transform: function(doc, ret) { delete ret._id; delete ret.__v; } }
});

medicalProfileSchema.virtual('id').get(function() { return this._id.toHexString(); });

module.exports = mongoose.models.MedicalProfile || mongoose.model('MedicalProfile', medicalProfileSchema);