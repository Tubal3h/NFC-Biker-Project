// in backend/src/models/premium-code.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const premiumCodeSchema = new Schema({
    code: { type: String, required: true, unique: true }, // Il codice, es. "PREMIUM-XYZ-123"
    isUsed: { type: Boolean, default: false }, // Per sapere se è già stato usato
    usedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // Chi lo ha usato
    usedAt: { type: Date, default: null } // Quando è stato usato
});

const PremiumCode = mongoose.model('PremiumCode', premiumCodeSchema);
module.exports = PremiumCode;