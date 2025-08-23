// migration-script.js (VERSIONE CON DEBUG)

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/user.model.js');
const MedicalProfile = require('./src/models/medical-profile.model.js');
const Tag = require('./src/models/tag.model.js');

async function runMigration() {
  if (!process.env.MONGODB_URI) {
    console.error('🔴 ERRORE: La variabile MONGODB_URI non è definita nel file .env.');
    return;
  }

  console.log('🚀 Avvio dello script di migrazione (MODALITÀ DEBUG)...');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connessione a MongoDB Atlas stabilita.');

    const allUsers = await mongoose.model('User').find().lean();
    console.log(`🔎 Trovati ${allUsers.length} utenti totali da verificare.`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      // Usiamo un blocco try...catch per ogni utente
      try {
        console.log(`\n-----------------------------------------------------`);
        console.log(`✨ Inizio processo per l'utente: ${user.email} (ID: ${user._id})`);

        // Controlliamo se l'utente ha il vecchio campo `medicalData`.
        if (!user.medicalData && !user.name && !user.surname) {
          console.log(`🔵 Utente già migrato o non necessita di migrazione. Skippato.`);
          continue; // Passa al prossimo utente
        }

        // --- PASSO 1: CREAZIONE PROFILO MEDICO ---
        console.log(`   [1/4] Tentativo di creare il MedicalProfile...`);
        const existingProfile = await MedicalProfile.findOne({ ownerId: user._id });
        
        let savedProfile;
        if (existingProfile) {
          console.log(`   -> Profilo medico già esistente (ID: ${existingProfile._id}). Lo usiamo.`);
          savedProfile = existingProfile;
        } else {
          const newProfile = new MedicalProfile({
            ownerId: user._id,
            profileName: 'Profilo Principale',
            name: user.name || '',
            surname: user.surname || '',
            bloodType: user.medicalData?.bloodType || null,
            allergies: user.medicalData?.allergies || '',
            conditions: user.medicalData?.conditions || '',
            notes: user.medicalData?.notes || '',
            emergencyContacts: user.medicalData?.emergencyContacts || []
          });
          savedProfile = await newProfile.save();
          console.log(`   -> ✅ Creato nuovo MedicalProfile con ID: ${savedProfile._id}`);
        }

        // --- PASSO 2: AGGIORNAMENTO TAG NFC ---
        console.log(`   [2/4] Tentativo di aggiornare i Tag NFC...`);
        if (user.nfcTags && user.nfcTags.length > 0) {
          const tagUpdateResult = await Tag.updateMany(
            { _id: { $in: user.nfcTags } },
            { $set: { profileId: savedProfile._id, userId: user._id } }
          );
          console.log(`   -> ✅ Aggiornati ${tagUpdateResult.modifiedCount} tag NFC.`);
        } else {
          console.log(`   -> Nessun tag da aggiornare per questo utente.`);
        }

        // --- PASSO 3: AGGIORNAMENTO DOCUMENTO UTENTE ---
        console.log(`   [3/4] Tentativo di aggiornare il documento User...`);
        const userUpdateResult = await User.updateOne(
          { _id: user._id },
          {
            $unset: { medicalData: "", name: "", surname: "" },
            $set: { premiumExpiresAt: user.premiumExpiresAt ?? null }
          }
        );

        if (userUpdateResult.modifiedCount > 0) {
          console.log(`   -> ✅ Documento utente pulito e aggiornato.`);
        } else {
          console.log(`   -> Il documento utente non ha richiesto modifiche.`);
        }

        // --- PASSO 4: COMPLETATO ---
        console.log(`   [4/4] ✅ Migrazione per ${user.email} completata con successo!`);
        migratedCount++;

      } catch (error) {
        // Se c'è un errore con un utente, lo stampiamo ma non blocchiamo lo script
        console.error(`🔴 ERRORE durante la migrazione dell'utente ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n-----------------------------------------------------`);
    console.log('✅ PROCESSO DI MIGRAZIONE TERMINATO!');
    console.log(`📊 Riepilogo:`);
    console.log(`   - Utenti migrati con successo: ${migratedCount}`);
    console.log(`   - Utenti con errori: ${errorCount}`);
    console.log(`   - Utenti totali verificati: ${allUsers.length}`);

  } catch (error) {
    console.error('🔴 ERRORE CRITICO GLOBALE:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connessione a MongoDB chiusa.');
  }
}

runMigration();