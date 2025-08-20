// in backend/generate-premium-code.js
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();
const PremiumCode = require('./src/models/premium-code.model.js');

async function generateCode() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const codeString = 'PREMIUM-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    
    const newCode = new PremiumCode({ code: codeString });
    await newCode.save();
    
    console.log(`✅ Codice Premium generato con successo: ${codeString}`);
  } finally {
    await mongoose.disconnect();
  }
}
generateCode();