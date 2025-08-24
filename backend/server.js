const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Carica le variabili dal file .env
const bcrypt = require('bcryptjs');

// Importiamo i nostri nuovi modelli Mongoose
const User = require('./src/models/user.model.js');
const Tag = require('./src/models/tag.model.js');
const PremiumCode = require('./src/models/premium-code.model.js');
const MedicalProfile = require('./src/models/medical-profile.model.js');


const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Connessione al Database MongoDB Atlas ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connessione a MongoDB Atlas stabilita con successo!'))
  .catch(err => console.error('🔴 Errore di connessione a MongoDB:', err));


// --- Endpoint API (Ora con la logica del Database) ---

/* -------------------------------------------------------------------------- */
/*                                LOGIN/SIGNUP                                */
/* -------------------------------------------------------------------------- */

// Registrazione
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e password obbligatorie.' });
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'Email già registrata' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Crea l'utente in memoria (Mongoose gli assegna un _id temporaneo)
    const newUser = new User({ email, password: hashedPassword });
    
    // 2. Crea il suo Profilo Principale, usando l'_id temporaneo dell'utente
    const mainProfile = new MedicalProfile({
      ownerId: newUser._id,
      profileName: 'Profilo Principale'
    });
    // Salva il profilo nel database
    await mainProfile.save();

    // 3. Ora che il profilo è salvato e ha un suo _id, lo colleghiamo all'utente
    newUser.mainProfileId = mainProfile._id;
    
    // 4. Solo adesso salviamo l'utente, che ora è completo di tutte le informazioni
    const savedUser = await newUser.save();

    // Prepariamo l'oggetto da restituire al frontend
    const userToReturn = savedUser.toObject();
    delete userToReturn.password;
    
    res.status(201).json({ success: true, data: userToReturn });
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});


// Login
// in server.js

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Trova l'utente e la sua password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    }

    // 2. Verifica la password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    }

    // --- NUOVA LOGICA DI CONTROLLO SCADENZA PREMIUM ---
    // 3. Controlliamo se l'utente era premium e se il suo abbonamento è scaduto
    if (user.premium && user.premiumExpiresAt && new Date() > user.premiumExpiresAt) {
      console.log(`L'abbonamento premium per ${user.email} è scaduto. Avvio procedura di downgrade.`);

      // A. Imposta lo stato premium a false
      user.premium = false;
      user.premiumExpiresAt = null;

      // B. Disattiva tutti i profili tranne quello principale
      await MedicalProfile.updateMany(
        { ownerId: user._id, _id: { $ne: user.mainProfileId } }, // Trova tutti i profili che NON sono quello principale
        { $set: { isActive: false } }
      );

      // C. Riassocia tutti i tag dell'utente al profilo principale
      await Tag.updateMany(
        { userId: user._id },
        { $set: { profileId: user.mainProfileId } }
      );
      
      // D. Salva le modifiche sull'utente
      await user.save();
      console.log(`Downgrade per ${user.email} completato.`);
    }
    // --- FINE LOGICA DI CONTROLLO ---

    // 4. Recupera il profilo medico principale (che ora è l'unico attivo se l'utente è stato declassato)
    const profile = await MedicalProfile.findOne({ ownerId: user._id, _id: user.mainProfileId });

    // 5. Prepara l'oggetto finale da inviare al frontend
    const userObject = user.toObject();
    delete userObject.password;

    if (profile) {
      userObject.name = profile.name;
      userObject.surname = profile.surname;
      userObject.medicalData = {
        bloodType: profile.bloodType,
        allergies: profile.allergies,
        conditions: profile.conditions,
        notes: profile.notes,
        emergencyContacts: profile.emergencyContacts
      };
    } else {
      userObject.name = '';
      userObject.surname = '';
      userObject.medicalData = {};
    }
    
    res.json({ success: true, data: userObject });

  } catch (error) {
    console.error("Errore critico durante il login:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

/* -------------------------------------------------------------------------- */
/*                               CAMBIO PASSWORD                              */
/* -------------------------------------------------------------------------- */
app.post('/api/user/:userId/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { userId } = req.params;

    // 1. Trova l'utente e recupera la sua password attuale hashata
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato.' });
    }

    // 2. Verifica che la password ATTUALE fornita sia corretta
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'La password attuale non è corretta.' });
    }

    // 3. Se la password attuale è corretta, hasha la NUOVA password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Aggiorna la password nel database e salva
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, data: { message: 'Password aggiornata con successo.' } });

  } catch (error) {
    console.error("Errore durante il cambio password:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server.' });
  }
});

/* -------------------------------------------------------------------------- */
/*                                     NFC                                    */
/* -------------------------------------------------------------------------- */

// Info tag NFC 
app.get('/api/tag/:nfcId', async (req, res) => {
  try {
    const tag = await Tag.findOne({ nfcId: req.params.nfcId });
    if (!tag) return res.status(404).json({ success: false, error: 'Tag non valido' });
    res.json({ success: true, data: tag });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// in server.js

/* -------------------------------------------------------------------------- */
/* Associa un Casco/NFC a un Utente                                           */
/* -------------------------------------------------------------------------- */
app.post('/api/claim', async (req, res) => {
  try {
    const { nfcId, userId } = req.body;

    // 1. Trova l'utente e assicurati che abbia un profilo principale
    const user = await User.findById(userId);
    if (!user || !user.mainProfileId) {
      return res.status(404).json({ success: false, error: 'Utente o profilo principale non trovato.' });
    }
    
    // 2. Trova il tag
    const tag = await Tag.findOne({ nfcId: nfcId });
    if (!tag) {
      return res.status(404).json({ success: false, error: 'Dispositivo NFC non trovato o non valido.' });
    }
    
    // 3. Controlla se il tag è già associato a qualcuno
    if (tag.userId) {
      return res.status(400).json({ success: false, error: 'Questo dispositivo è già associato a un account.' });
    }
    
    // 4. Controlla i limiti del piano dell'utente
    if (!user.premium && user.nfcTags.length >= 1) {
      return res.status(403).json({ success: false, error: 'Hai raggiunto il limite di 1 casco per il piano Gratuito.' });
    }
    if (user.premium && user.nfcTags.length >= 10) {
      return res.status(403).json({ success: false, error: 'Hai raggiunto il limite di 10 caschi per il piano Premium.' });
    }

    // --- ECCO LA LOGICA FONDAMENTALE ---
    // 5. Associa il tag sia all'utente SIA al suo profilo principale
    tag.userId = user._id;
    tag.profileId = user.mainProfileId; // <-- Assegnazione automatica
    
    // 6. Aggiungi il tag alla lista dell'utente
    user.nfcTags.push(tag._id);
    
    // 7. Salva entrambe le modifiche
    await tag.save();
    await user.save();
    
    res.json({ 
      success: true, 
      data: { 
        message: 'Casco associato con successo al tuo profilo principale!',
        profileId: user.mainProfileId 
      } 
    });
  } catch (error) { 
    console.error("Errore durante il claim del tag:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' }); 
  }
});

app.get('/api/user/:userId/tags', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('nfcTags');
    if (!user) return res.status(404).json({ success: false, error: 'Utente non trovato' });
    res.json({ success: true, data: user.nfcTags });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// Claim casco/NFC
app.post('/api/claim', async (req, res) => {
  try {
    const { nfcId, userId } = req.body;
    const user = await User.findById(userId);
    const tag = await Tag.findOne({ nfcId: nfcId });

    if (!user || !tag) return res.status(404).json({ success: false, error: 'Utente o Tag non trovato' });
    if (tag.profileId || tag.userId) return res.status(400).json({ success: false, error: 'Tag già associato' });

    if (!user.premium && user.nfcTags.length >= 1) {
      return res.status(403).json({ success: false, error: 'Limite raggiunto' });
    }

    const userProfile = await MedicalProfile.findOne({ ownerId: user._id });
    if (!userProfile) return res.status(404).json({ success: false, error: 'Profilo medico non trovato.' });
    
    // --- ECCO LA CORREZIONE FONDAMENTALE ---
    tag.profileId = userProfile._id;
    tag.userId = user._id; // <-- Aggiungi questa riga
    user.nfcTags.push(tag._id);
    
    await tag.save();
    await user.save();
    
    res.json({ 
      success: true, 
      data: { 
        message: 'Tag associato con successo',
        profileId: userProfile._id 
      } 
    });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// Rinomina un tag/casco
app.patch('/api/tags/:tagId/rename', async (req, res) => {
  try {
    const { tagId } = req.params;
    const { alias } = req.body; // Prendiamo il nuovo nome dal corpo della richiesta

    // 1. Validazione di base
    if (!alias || typeof alias !== 'string' || alias.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Il nome fornito non è valido.' });
    }

    // 2. Trova il tag tramite il suo _id e aggiornalo
    // findByIdAndUpdate è un comando Mongoose super efficiente per questo
    const updatedTag = await Tag.findByIdAndUpdate(
      tagId,
      { alias: alias.trim() }, // Dati da aggiornare (trim() pulisce gli spazi)
      { new: true } // Opzione per restituire il documento aggiornato, non quello vecchio
    );

    if (!updatedTag) {
      return res.status(404).json({ success: false, error: 'Tag non trovato.' });
    }

    // 3. Invia il tag aggiornato come conferma
    res.json({ success: true, data: updatedTag });

  } catch (error) {
    console.error("Errore durante la rinomina del tag:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

/* -------------------------------------------------------------------------- */
/*                                    USER                                    */
/* -------------------------------------------------------------------------- */

// Ottieni i dati di un singolo utente (per la Scheda)
app.get('/api/user/:userId', async (req, res) => {
  try {
    // Cerca l'utente nel database tramite il suo _id
    const user = await User.findById(req.params.userId);
    
    // Se non viene trovato, restituisci un errore 404
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }

    // Se viene trovato, restituisci i suoi dati (la trasformazione toJSON si occuperà di togliere la password)
    res.json({ success: true, data: user });

  } catch (error) {
    // Gestisce altri errori (es. ID in formato non valido)
    console.error("Errore nel recuperare l'utente:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});


/* -------------------------------------------------------------------------- */
/*                            gestione piu profili                            */
/* -------------------------------------------------------------------------- */

// Ottiene TUTTI i profili medici di un utente (per la pagina di gestione)
app.get('/api/user/:userId/profiles', async (req, res) => {
  try {
    const profiles = await MedicalProfile.find({ ownerId: req.params.userId });
    res.json({ success: true, data: profiles });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// Ottiene un SINGOLO profilo medico tramite il suo ID (per la Scheda e il Form)
app.get('/api/profiles/:profileId', async (req, res) => {
  try {
    const profile = await MedicalProfile.findById(req.params.profileId);
    if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
    res.json({ success: true, data: profile });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// Aggiorna un SINGOLO profilo medico
app.put('/api/profiles/:profileId', async (req, res) => {
  try {
    const profile = await MedicalProfile.findByIdAndUpdate(req.params.profileId, req.body, { new: true });
    if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
    res.json({ success: true, data: profile });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// in server.js

/* -------------------------------------------------------------------------- */
/* IMPOSTA UN NUOVO PROFILO PRINCIPALE (SOLO PREMIUM)             */
/* -------------------------------------------------------------------------- */
app.patch('/api/user/:userId/set-main-profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newProfileId } = req.body;

    // 1. Controlli di base
    if (!newProfileId) {
      return res.status(400).json({ success: false, error: 'ID del nuovo profilo non fornito.' });
    }

    // 2. Trova l'utente
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato.' });
    }

    // 3. CONTROLLO DI SICUREZZA: Solo gli utenti Premium possono usare questa funzione
    if (!user.premium) {
      return res.status(403).json({ 
        success: false, 
        error: 'Questa funzionalità è riservata agli utenti Premium.' 
      });
    }

    // 4. Trova il profilo che si vuole impostare come principale
    const newMainProfile = await MedicalProfile.findById(newProfileId);

    // 5. CONTROLLO DI SICUREZZA:
    //    - Il profilo esiste?
    //    - Il profilo appartiene effettivamente a questo utente?
    if (!newMainProfile || newMainProfile.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Non hai il permesso di impostare questo profilo come principale.' 
      });
    }

    // 6. Se tutti i controlli sono superati, aggiorna l'utente
    user.mainProfileId = newMainProfile._id;
    await user.save();

    res.json({ 
      success: true, 
      data: { message: 'Profilo principale aggiornato con successo.' } 
    });

  } catch (error) {
    console.error("Errore durante l'impostazione del profilo principale:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server.' });
  }
});

/* -------------------------------------------------------------------------- */
/*                             CAMBIO NOME/COGNOME                            */
/* -------------------------------------------------------------------------- */
app.patch('/api/user/:userId/profile', async (req, res) => {
  try {
    const { name, surname } = req.body;
    const { userId } = req.params;

    // 1. Trova l'utente nel database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }

    // 2. Valida i dati in arrivo (best practice!)
    if (!name || !surname || name.trim() === '' || surname.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome e cognome sono obbligatori.' });
    }

    // 3. Aggiorna i campi e salva il documento
    user.name = name;
    user.surname = surname;
    const savedUser = await user.save();
    
    // 4. Restituisci l'utente aggiornato e completo (la trasformazione toJSON toglie la password)
    res.json({ success: true, data: savedUser });

  } catch (error) {
    console.error("Errore durante l'aggiornamento del profilo:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

/* -------------------------------------------------------------------------- */
/*                              API DATI SANITARI                             */
/* -------------------------------------------------------------------------- */


// 1. OTTIENI TUTTI i profili di un utente 
app.get('/api/user/:userId/profiles', async (req, res) => {
  try {
    const profiles = await MedicalProfile.find({ ownerId: req.params.userId });
    res.json({ success: true, data: profiles });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// 2. CREA un nuovo profilo per un utente
app.post('/api/user/:userId/profiles', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profileName } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Utente non trovato' });
    
    // Regola Premium: solo gli utenti premium possono creare nuovi profili
    if (!user.premium) {
      return res.status(403).json({ success: false, error: 'Solo gli account Premium possono creare profili multipli.' });
    }

    const newProfile = new MedicalProfile({
      ownerId: userId,
      profileName: profileName || 'Nuovo Profilo'
    });
    const savedProfile = await newProfile.save();

    res.status(201).json({ success: true, data: savedProfile });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});


// 3. ELIMINA un profilo medico specifico
// in server.js

// ELIMINA un profilo medico specifico (Logica Aggiornata)
app.delete('/api/profiles/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    // 1. Trova il profilo che si vuole eliminare
    const profileToDelete = await MedicalProfile.findById(profileId);
    if (!profileToDelete) {
      return res.status(404).json({ success: false, error: 'Profilo non trovato.' });
    }

    // --- NUOVO CONTROLLO DI SICUREZZA ---
    // 2. Trova l'utente proprietario del profilo
    const owner = await User.findById(profileToDelete.ownerId);

    // 3. Controlla se il profilo da eliminare è il profilo principale
    if (owner && owner.mainProfileId.toString() === profileToDelete._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Non puoi eliminare il tuo profilo principale.' 
      });
    }
    // --- FINE CONTROLLO ---

    // 4. Se non è il profilo principale, procedi con l'eliminazione
    await Tag.updateMany({ profileId: profileId }, { $set: { profileId: null } });
    await MedicalProfile.findByIdAndDelete(profileId);

    res.json({ success: true, data: { message: 'Profilo eliminato con successo.' } });
  } catch (error) { 
    console.error("Errore durante l'eliminazione del profilo:", error);
    res.status(500).json({ success: false, error: 'Errore server' }); 
  }
});


/* -------------------------------------------------------------------------- */
/*               Visualizza i caschi (tag) associati a un utente              */
/* -------------------------------------------------------------------------- */
app.get('/api/user/:userId/tags', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Trova l'utente e usa .populate() per caricare i dettagli dei tag
    const user = await User.findById(userId).populate('nfcTags');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }

    // 2. Restituisci l'array di oggetti Tag completi
    res.json({ success: true, data: user.nfcTags });

  } catch (error) {
    console.error("Errore nel recuperare i tag dell'utente:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

/* -------------------------------------------------------------------------- */
/*                     Dissocia un casco/tag da un utente                     */
/* -------------------------------------------------------------------------- */
app.delete('/api/tags/:nfcId/dissociate', async (req, res) => {
  try {
    const { nfcId } = req.params;
    
    // 1. Trova il tag usando il suo nfcId
    const tag = await Tag.findOne({ nfcId: nfcId });
    if (!tag || !tag.userId) {
      return res.status(404).json({ success: false, error: 'Tag non trovato o già dissociato.' });
    }

    // 2. Trova l'utente a cui appartiene il tag
    const user = await User.findById(tag.userId);
    if (user) {
      // Rimuovi l'ObjectId del tag dall'array nfcTags dell'utente
      user.nfcTags.pull(tag._id);
      await user.save();
    }

    // 3. Rimuovi il riferimento all'utente dal tag
    tag.userId = null;
    tag.profileId = null;
    await tag.save();

    res.json({ success: true, data: { message: 'Tag dissociato con successo.' } });

  } catch (error) {
    console.error("Errore durante la dissociazione:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

/* -------------------------------------------------------------------------- */
/*                               Reset Password                               */
/* -------------------------------------------------------------------------- */


const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, data: { message: 'Se l\'email è registrata, riceverai un link per il reset.' } });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `https://www.soshelmet.it/reset-password/${resetToken}`;
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net', port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
    });
    
    await transporter.sendMail({
      from: `S.O.S. Helmet <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: 'Reset della tua password per S.O.S. Helmet',
      html: `<p>Clicca su questo link per resettare la tua password (valido per 1 ora): <a href="${resetUrl}">${resetUrl}</a></p>`
    });

    res.json({ success: true, data: { message: 'Email di reset inviata.' } });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});


app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ 
      _id: decoded.id, 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } 
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, error: 'Token non valido o scaduto.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, data: { message: 'Password resettata con successo.' } });
  } catch (error) { res.status(500).json({ success: false, error: 'Token non valido o scaduto.' }); }
});

/* -------------------------------------------------------------------------- */
/*               Attiva l'abbonamento Premium tramite un codice               */
/* -------------------------------------------------------------------------- */
app.post('/api/user/:userId/upgrade-premium', async (req, res) => {
  try {
    const { userId } = req.params;
    const { activationCode } = req.body;

    // 1. Cerca il codice nel database
    const code = await PremiumCode.findOne({ code: activationCode });

    if (!code || code.isUsed) {
      return res.status(400).json({ success: false, error: 'Codice non valido o già utilizzato.' });
    }

    // 2. Cerca l'utente
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato.' });
    }
    
    // 3. Attiva il premium per l'utente
    user.premium = true;
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    user.premiumExpiresAt = oneYearFromNow;
    
    // 4. "Brucia" il codice per non farlo riutilizzare
    code.isUsed = true;
    code.usedBy = user._id;
    code.usedAt = new Date();

    // 5. Salva tutto nel database
    await user.save();
    await code.save();

    const userToReturn = user.toObject();
    delete userToReturn.password;
    res.json({ success: true, data: userToReturn });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});


/* -------------------------------------------------------------------------- */
/*                                MULTI PROFILO                               */
/* -------------------------------------------------------------------------- */
app.get('/api/medical-profile/:profileId', async (req, res) => {
  try {
    const profile = await MedicalProfile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profilo medico non trovato' });
    }
    res.json({ success: true, data: profile });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

app.patch('/api/tags/:nfcId/switch-profile', async (req, res) => {
  try {
    const { nfcId } = req.params;
    const { newProfileId } = req.body;
    
    const tag = await Tag.findOne({ nfcId: nfcId });
    if (!tag) return res.status(404).json({ error: 'Tag non trovato' });
    
    // Logica di sicurezza: solo il proprietario può cambiare il profilo
    // (Aggiungeremo questa logica dopo)
    
    tag.profileId = newProfileId;
    await tag.save();
    res.json({ success: true, data: tag });
  } catch (error) { res.status(500).json({ error: 'Errore server' }); }
});

// Cambia il profilo medico associato a un tag
app.patch('/api/tags/:nfcId/switch-profile', async (req, res) => {
  try {
    const { nfcId } = req.params;
    const { newProfileId } = req.body;

    // 1. Trova il tag e il nuovo profilo
    const tag = await Tag.findOne({ nfcId: nfcId });
    const newProfile = await MedicalProfile.findById(newProfileId);

    if (!tag || !newProfile) {
      return res.status(404).json({ success: false, error: 'Tag o Profilo non trovato.' });
    }

    // 2. Logica di sicurezza (fondamentale):
    // Assicurati che il tag appartenga all'utente che possiede il nuovo profilo.
    // (Questa logica andrebbe migliorata con l'autenticazione JWT, ma per ora va bene)
    if (tag.userId.toString() !== newProfile.ownerId.toString()) {
      return res.status(403).json({ success: false, error: 'Non hai il permesso di modificare questo tag.' });
    }

    // 3. Aggiorna il riferimento e salva
    tag.profileId = newProfile._id;
    await tag.save();

    res.json({ success: true, data: tag });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore interno del server.' });
  }
});
// 1. Ottiene la lista dei tag di un utente che NON sono ancora associati a un profilo
app.get('/api/user/:userId/unassigned-tags', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('nfcTags');
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    // Filtra i tag per trovare solo quelli senza un profileId
    const unassignedTags = user.nfcTags.filter(tag => !tag.profileId);
    
    res.json({ success: true, data: unassignedTags });
  } catch (error) { res.status(500).json({ error: 'Errore server' }); }
});

// 2. Associa un tag specifico a un profilo medico specifico
app.patch('/api/tags/:tagId/assign-profile', async (req, res) => {
  try {
    const { tagId } = req.params;
    const { profileId } = req.body;

    const tag = await Tag.findById(tagId);
    if (!tag) return res.status(404).json({ error: 'Tag non trovato' });

    tag.profileId = profileId;
    await tag.save();
    
    res.json({ success: true, data: tag });
  } catch (error) { res.status(500).json({ error: 'Errore server' }); }
});

// in backend/server.js

// in server.js

// Sincronizza i tag associati a un profilo medico
app.post('/api/profiles/:profileId/sync-tags', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { tagIds, ownerId } = req.body; // L'ownerId è l'ID dell'utente

    // 1. Trova l'utente e assicurati che abbia un profilo principale
    const user = await User.findById(ownerId);
    if (!user || !user.mainProfileId) {
      return res.status(404).json({ success: false, error: 'Utente o profilo principale non trovato.' });
    }

    // 2. GESTIONE DEI TAG RIMOSSI DAL PROFILO ATTUALE
    // Trova tutti i tag che erano su questo profilo ma NON sono nella nuova lista...
    await Tag.updateMany(
      { userId: user._id, profileId: profileId, _id: { $nin: tagIds } },
      // ...e invece di lasciarli "orfani", riassegnali al profilo principale.
      { $set: { profileId: user.mainProfileId } }
    );
    
    // 3. GESTIONE DEI TAG AGGIUNTI AL PROFILO ATTUALE
    // Assegna la nuova lista di tag a questo profilo.
    await Tag.updateMany(
      { userId: user._id, _id: { $in: tagIds } }, 
      { $set: { profileId: profileId } }
    );

    res.json({ success: true, data: { message: 'Associazioni aggiornate con successo.' } });
  } catch (error) {
    console.error("Errore durante la sincronizzazione dei tag:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});


/* -------------------------------------------------------------------------- */
/*                                    EXTRA                                   */
/* -------------------------------------------------------------------------- */

// in server.js, aggiungi questa nuova rotta

app.get('/api/location-info', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'Latitudine e longitudine necessarie.' });
    }

    // Il tuo server fa la chiamata a Nominatim (le chiamate server-to-server non hanno problemi di CORS)
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: { 'User-Agent': 'SOS-Helmet-App/1.0' } // Nominatim richiede un User-Agent
    });
    
    const data = await response.json();
    
    // Estrai la città o il paese
    let locationName = 'Posizione rilevata';
    if (data && data.address) {
      locationName = data.address.city || data.address.town || data.address.county || data.address.country;
    }

    res.json({ success: true, data: { location: locationName } });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Impossibile recuperare le informazioni sulla posizione.' });
  }
});

app.listen(PORT, () => {
  console.log(`S.O.S. Helmet backend attivo su http://localhost:${PORT}`);
});