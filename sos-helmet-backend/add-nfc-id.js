const fs = require('fs');
const crypto = require('crypto');

const DB_FILE = './db.json';

// Genera un ID NFC random, es: NFC-XY2Z9F3J
function generateNfcId() {
  return 'NFC-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

function addNfcTag() {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const newId = generateNfcId();
  db.tags.push({ id: newId, userId: null });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  console.log('Nuovo tag NFC aggiunto:', newId);
}

addNfcTag();
