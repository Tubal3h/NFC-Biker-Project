// in backend/generate-premium-code.js
import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid'; // Importiamo customAlphabet
import 'dotenv/config'; // Sintassi moderna per dotenv
import PremiumCode from './src/models/premium-code.model.js';

// 1. Definiamo un alfabeto "human-friendly"
// Escludiamo caratteri che si possono confondere come 0, O, 1, I, l
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

// 2. Creiamo una funzione generatrice nanoid
// Chiediamo 12 caratteri dal nostro alfabeto personalizzato
const generateId = customAlphabet(alphabet, 12);

async function generateCode() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // 3. Generiamo il codice base
    const baseCode = generateId(); // es. '4R7K9N2PXD6Y'

    // 4. Formattiamo il codice in blocchi per una leggibilità superiore
    const formattedCode = `PREMIUM-${baseCode.match(/.{1,4}/g).join('-')}`;
    // Risultato finale: PREMIUM-4R7K-9N2P-XD6Y

    const newCode = new PremiumCode({ code: formattedCode });
    await newCode.save();
    
    console.log(`✅ Codice Premium generato con successo: ${formattedCode}`);

  } catch (error) {
    console.error('🔴 Errore durante la generazione del codice:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

generateCode();