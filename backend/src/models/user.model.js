// in backend/src/models/user.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definiamo la struttura per i contatti d'emergenza, che sarà un sotto-documento
const emergencyContactSchema = new Schema({
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true }
}, { _id: false }); // _id: false evita che Mongoose crei un ID per ogni contatto

// Definiamo la struttura per i dati medici, che sarà un oggetto annidato
const medicalDataSchema = new Schema({
    bloodType: { type: String, default: null },
    allergies: { type: String, default: '' },
    conditions: { type: String, default: '' },
    notes: { type: String, default: '' },
    emergencyContacts: [emergencyContactSchema]
}, { _id: false });

const userSchema = new Schema({
    name: { type: String, default: '' },
    surname: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    premium: { type: Boolean, default: false }, // L'utente parte come non-premium
    premiumExpiresAt: { type: Date, default: null }, // Data in cui scade l'abbonamento
    nfcTags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    medicalData: medicalDataSchema
}, {
    timestamps: true,
    toJSON: { virtuals: true, transform: function(doc, ret) { delete ret._id; delete ret.__v; } },
    toObject: { virtuals: true, transform: function(doc, ret) { delete ret._id; delete ret.__v; } }
});

userSchema.virtual('id').get(function() { return this._id.toHexString(); });
const User = mongoose.model('User', userSchema);
module.exports = User;