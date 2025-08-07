// in backend/add-nfc-id.js

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();
const Tag = require('./src/models/tag.model.js');

function generateNfcId() {
  return 'NFC-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

async function addNfcTag() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB per aggiungere un tag...');

    const newNfcIdValue = generateNfcId();
    
    // Crea un nuovo documento Tag con la struttura corretta
    const newTag = new Tag({
      nfcId: newNfcIdValue // Salva il valore nel campo corretto
    });

    await newTag.save();
    console.log('✅ Nuovo tag NFC aggiunto al database:', newNfcIdValue);

  } catch (error) {
    console.error('🔴 Errore durante l-aggiunta del tag:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnesso da MongoDB.');
  }
}

addNfcTag();