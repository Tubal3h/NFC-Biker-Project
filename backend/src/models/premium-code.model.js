// in backend/src/models/premium-code.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const premiumCodeSchema = new Schema({
    code: { type: String, required: true, unique: true },
    isUsed: { type: Boolean, default: false },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    usedAt: { type: Date, default: null }
});

// Applica il fix per OverwriteModelError
module.exports = mongoose.models.PremiumCode || mongoose.model('PremiumCode', premiumCodeSchema);