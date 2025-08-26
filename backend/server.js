// ======================================================
// --- SETUP INIZIALE E IMPORT ---
// ======================================================
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import dei Modelli
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


// ======================================================
// --- MIDDLEWARE DI AUTENTICAZIONE (La nostra "guardia") ---
// ======================================================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Accesso negato. Token non fornito.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Salva i dati dell'utente (es. id, email) nella richiesta
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Sessione scaduta o token non valido.' });
  }
};

// ======================================================
// --- ROTTE API ---
// ======================================================

// ======================================================
// --- SEZIONE AUTENTICAZIONE (Pubblica) ---
// ======================================================

/**
 * @route   POST /api/register
 * @desc    Registra un nuovo utente, crea il suo profilo principale e lo logga.
 */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e password obbligatorie.' });
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'Email già registrata' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ email, password: hashedPassword });
    // --- NUOVA LOGICA DI VERIFICA ---
    // 1. Genera un token di verifica sicuro e univoco
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = verificationToken;
    newUser.verificationExpires = Date.now() + 3600000 * 24; // Scade tra 24 ore

    // 2. Invia l'email di verifica
    const verificationUrl = `https://www.soshelmet.it/verify-email/${verificationToken}`;

    // --- INTEGRAZIONE TEMPLATE ---

    const templatePath = path.join(__dirname, 'templates', 'email-template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    const replacements = {
        SUBJECT: "Benvenuto in S.O.S. Helmet! Verifica il tuo Account",
        PREHEADER_TEXT: "Manca solo un ultimo passo per attivare il tuo account.",
        EMAIL_TITLE: "Conferma il tuo Indirizzo Email",
        EMAIL_BODY: "Grazie per esserti registrato su S.O.S. Helmet! Per favore, clicca sul pulsante qui sotto per verificare il tuo account e sbloccare tutte le funzionalità.",
        ACTION_URL: verificationUrl,
        BUTTON_TEXT: "Verifica il mio Account"
    };

    for (const key in replacements) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }

    // --- FINE INTEGRAZIONE ---
    
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net', port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
    });
    
    await transporter.sendMail({
      from: `S.O.S. Helmet <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: replacements.SUBJECT,
      html: htmlContent
    });
    // --- FINE NUOVA LOGICA ---    
    const mainProfile = new MedicalProfile({ ownerId: newUser._id, profileName: 'Profilo Principale' });
    await mainProfile.save();
    newUser.mainProfileId = mainProfile._id;
    const savedUser = await newUser.save();
    const payload = { id: savedUser._id, email: savedUser.email, premium: savedUser.premium };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    const userToReturn = savedUser.toObject();
    delete userToReturn.password;
    res.status(201).json({success: true, token: token, data: userToReturn});
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});



/**
 * @route   POST /api/login
 * @desc    Autentica un utente, esegue il controllo della scadenza premium e restituisce token e dati.
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    if (user.premium && user.premiumExpiresAt && new Date() > user.premiumExpiresAt) {
      user.premium = false;
      user.premiumExpiresAt = null;
      await MedicalProfile.updateMany({ ownerId: user._id, _id: { $ne: user.mainProfileId } }, { $set: { isActive: false } });
      await Tag.updateMany({ userId: user._id }, { $set: { profileId: user.mainProfileId } });
      await user.save();
    }
    const payload = { id: user._id, email: user.email, premium: user.premium, isVerified: user.isVerified };
    const expiresIn = rememberMe ? '30d' : '1m';
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    const profile = await MedicalProfile.findById(user.mainProfileId);
    const userObject = user.toObject();
    delete userObject.password;
    if (profile) {
      userObject.name = profile.name;
      userObject.surname = profile.surname;
    }
    res.json({ success: true, token, data: userObject });
  } catch (error) {
    console.error("Errore critico durante il login:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

// ======================================================
// --- SEZIONE UTENTE (Protetta) ---
// ======================================================

/**
 * @route   POST /api/user/:userId/change-password
 * @desc    Permette a un utente loggato di cambiare la propria password.
 * @access  Protected
 */
app.post('/api/user/:userId/change-password', authMiddleware, async (req, res) => {
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

/**
 * @route   POST /api/claim
 * @desc    Associa un tag a un utente loggato.
 * @access  Protected
 */
app.post('/api/claim', authMiddleware, async (req, res) => {
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


/**
 * @route   PATCH /api/tags/:tagId/rename
 * @desc    Rinomina un tag.
 * @access  Protected
 */
app.patch('/api/tags/:tagId/rename', authMiddleware, async (req, res) => {
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

/**
 * @route   GET /api/profiles/:profileId
 * @desc    Ottiene un singolo profilo medico.
 * @access  Protected
 */
app.get('/api/profiles/:profileId', async (req, res) => {
  try {
    const profile = await MedicalProfile.findById(req.params.profileId);
    if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
    res.json({ success: true, data: profile });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

/**
 * @route   PUT /api/profiles/:profileId
 * @desc    Aggiorna un profilo medico.
 * @access  Protected
 */
app.put('/api/profiles/:profileId', authMiddleware, async (req, res) => {
  try {
    const profile = await MedicalProfile.findByIdAndUpdate(req.params.profileId, req.body, { new: true });
    if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
    res.json({ success: true, data: profile });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});


/* -------------------------------------------------------------------------- */
/* IMPOSTA UN NUOVO PROFILO PRINCIPALE (SOLO PREMIUM)             */
/* -------------------------------------------------------------------------- */

/**
 * @route   PATCH /api/user/:userId/set-main-profile
 * @desc    Permette a un utente Premium di cambiare il suo profilo principale.
 * @access  Protected
 */
app.patch('/api/user/:userId/set-main-profile', authMiddleware, async (req, res) => {
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


/**
 * @route   PATCH /api/tags/:nfcId/switch-profile
 * @desc    Cambia il profilo associato a un tag (per utenti Premium).
 * @access  Protected
 */
app.patch('/api/tags/:nfcId/switch-profile', authMiddleware, async (req, res) => {
  try {
    const { nfcId } = req.params;
    const { newProfileId } = req.body;

    const tag = await Tag.findOne({ nfcId: nfcId });
    const newProfile = await MedicalProfile.findById(newProfileId);

    if (!tag || !newProfile) {
      return res.status(404).json({ success: false, error: 'Tag o Profilo non trovato.' });
    }

    // Sicurezza: controlla che il tag e il nuovo profilo appartengano allo stesso utente
    if (tag.userId.toString() !== newProfile.ownerId.toString()) {
      return res.status(403).json({ success: false, error: 'Non hai il permesso di eseguire questa azione.' });
    }

    tag.profileId = newProfile._id;
    await tag.save();
    res.json({ success: true, data: tag });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore interno del server.' });
  }
});

/* -------------------------------------------------------------------------- */
/*                              API DATI SANITARI                             */
/* -------------------------------------------------------------------------- */


// ======================================================
// --- SEZIONE PROFILI MEDICI (Protetta) ---
// ======================================================

/**
 * @route   POST /api/user/:userId/profiles
 * @desc    Crea un nuovo profilo medico per un utente Premium.
 * @access  Protected
 */
app.post('/api/user/:userId/profiles', authMiddleware, async (req, res) => {
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

/**
 * @route   GET /api/user/:userId/profiles
 * @desc    Ottiene tutti i profili medici di un utente.
 * @access  Protected
 */
app.get('/api/user/:userId/profiles', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, error: 'Utente non trovato.' });
    }
    const profilesFromDB = await MedicalProfile.find({ ownerId: userId });

    const profilesWithStatus = profilesFromDB.map(profile => {
      // SOLUZIONE: Aggiungiamo l'opzione per includere i campi virtuali come 'id'
      const profileObject = profile.toObject({ virtuals: true }); 

      let isActive = false;
      if (user.premium) {
        isActive = true;
      } else {
        // Questa riga ora è sicura grazie al controllo precedente e alla soluzione di adesso
        isActive = user.mainProfileId && (profileObject.id.toString() === user.mainProfileId.toString());
      }
      
      profileObject.isActive = isActive;
      return profileObject;
    });

    res.json({ success: true, data: profilesWithStatus });

  } catch (error) { 
    console.error("Errore nel recuperare i profili utente:", error);
    res.status(500).json({ success: false, error: 'Errore server' }); 
  }
});


/**
 * @route   DELETE /api/profiles/:profileId
 * @desc    Elimina un profilo medico (se non è quello principale).
 * @access  Protected
 */
app.delete('/api/profiles/:profileId', authMiddleware, async (req, res) => {
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
  await Tag.updateMany({ profileId: profileId }, { $set: { profileId: owner.mainProfileId } });
    await MedicalProfile.findByIdAndDelete(profileId);

    res.json({ success: true, data: { message: 'Profilo eliminato con successo.' } });
  } catch (error) { 
    console.error("Errore durante l'eliminazione del profilo:", error);
    res.status(500).json({ success: false, error: 'Errore server' }); 
  }
});


/**
 * @route   GET /api/user/:userId/tags
 * @desc    Ottiene tutti i tag di un utente, completi di dettagli.
 * @access  Protected
 */
app.get('/api/user/:userId/tags', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('nfcTags'); // <-- USA .populate()

    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }
    res.json({ success: true, data: user.nfcTags });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

/**
 * @route   DELETE /api/tags/:nfcId/dissociate
 * @desc    Dissocia un tag da un utente.
 * @access  Protected
 */
app.delete('/api/tags/:nfcId/dissociate', authMiddleware, async (req, res) => {
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


// const nodemailer = require('nodemailer');

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

        // --- INTEGRAZIONE TEMPLATE ---

    // 1. Leggi il template HTML
    const templatePath = path.join(__dirname, 'templates', 'email-template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // 2. Definisci il contenuto specifico per QUESTA email
    const replacements = {
        SUBJECT: "Reset della tua password per S.O.S. Helmet",
        PREHEADER_TEXT: "Abbiamo ricevuto una richiesta per resettare la tua password.",
        EMAIL_TITLE: "Richiesta di Reset Password",
        EMAIL_BODY: "Abbiamo ricevuto una richiesta per resettare la password del tuo account. Clicca sul pulsante qui sotto per sceglierne una nuova. Se non hai richiesto tu questa modifica, puoi ignorare questa email.",
        ACTION_URL: resetUrl,
        BUTTON_TEXT: "Resetta la Password"
    };

    // 3. Sostituisci i placeholder
    for (const key in replacements) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }

    
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net', port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
    });
    
    await transporter.sendMail({
      from: `S.O.S. Helmet <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: replacements.SUBJECT,
      html: htmlContent
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

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verifica l'email di un utente tramite il token.
 */
app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Cerca un utente con questo token che non sia ancora scaduto
    const user = await User.findOne({ 
      verificationToken: token,
      verificationExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Token non valido o scaduto. Richiedi una nuova verifica.' });
    }

    // Se l'utente viene trovato, verificalo!
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ success: true, data: { message: 'Account verificato con successo!' } });

  } catch (error) {
    console.error("Errore durante la verifica email:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server.' });
  }
});


app.post('/api/auth/resend-verification', authMiddleware, async (req, res) => {
  try {
    // 1. Trova l'utente usando l'ID salvato nel token dal middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato.' });
    }

    // 2. Controlla se l'utente è già verificato
    if (user.isVerified) {
      return res.status(400).json({ success: false, error: 'Il tuo account è già verificato.' });
    }

    // 3. Genera un nuovo token di verifica e imposta una nuova scadenza
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationExpires = Date.now() + 3600000 * 24; // Scadenza tra 24 ore
    await user.save();

    const verificationUrl = `https://www.soshelmet.it/verify-email/${verificationToken}`;

        // --- NUOVA LOGICA PER IL TEMPLATE ---

    // 1. Leggi il template HTML
    const templatePath = path.join(__dirname, 'templates', 'email-template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // 2. Definisci il contenuto specifico per questa email
    const replacements = {
        SUBJECT: "Verifica il tuo Account S.O.S. Helmet",
        PREHEADER_TEXT: "Manca solo un ultimo passo per attivare il tuo account.",
        EMAIL_TITLE: "Conferma il tuo Indirizzo Email",
        EMAIL_BODY: "Grazie per esserti registrato su S.O.S. Helmet! Per favore, clicca sul pulsante qui sotto per verificare il tuo account e sbloccare tutte le funzionalità.",
        ACTION_URL: verificationUrl,
        BUTTON_TEXT: "Verifica il mio Account"
    };

    // 3. Sostituisci i placeholder con il contenuto reale
    for (const key in replacements) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }
    
    // --- FINE NUOVA LOGICA ---

    // 4. Inizializza e usa nodemailer per inviare l'email
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });

    await transporter.sendMail({
      from: `S.O.S. Helmet <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: replacements.SUBJECT,
      html: htmlContent
    });

    res.json({ success: true, message: 'Email di verifica inviata nuovamente.' });

  } catch (error) {
    console.error("Errore durante il reinvio dell'email di verifica:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server.' });
  }
});

/* -------------------------------------------------------------------------- */
/*               Attiva l'abbonamento Premium tramite un codice               */
/* -------------------------------------------------------------------------- */

/**
 * @route   POST /api/user/:userId/upgrade-premium
 * @desc    Attiva il premium per un utente con un codice.
 * @access  Protected
 */
app.post('/api/user/:userId/upgrade-premium', authMiddleware, async (req, res) => {
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




// in backend/server.js

// in server.js

/**
 * @route   POST /api/profiles/:profileId/sync-tags
 * @desc    Sincronizza i tag associati a un profilo.
 * @access  Protected
 */
app.post('/api/profiles/:profileId/sync-tags', authMiddleware, async (req, res) => {
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

// ======================================================
// --- SEZIONE UTILITY (Pubblica) ---
// ======================================================

/**
 * @route   GET /api/location-info
 * @desc    Proxy per ottenere dati di geolocalizzazione senza problemi di CORS.
 * @access  Public
 */
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

/* -------------------------------------------------------------------------- */
/*                           AUTO DELETE USER & DATA                          */
/* -------------------------------------------------------------------------- */

cron.schedule('0 3 * * *', async () => {
  console.log('⏰ Esecuzione del cron job: pulizia account non verificati dopo 90 giorni...');
  
  try {
    // Calcola la data di 90 giorni fa
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // 1. Trova tutti gli utenti che NON sono verificati E che sono stati creati più di 90 giorni fa
    const usersToDelete = await User.find({
      isVerified: false,
      createdAt: { $lt: ninetyDaysAgo }
    });

    if (usersToDelete.length > 0) {
      const userIds = usersToDelete.map(user => user._id);
      
      console.log(`Trovati ${userIds.length} account da eliminare.`);
      
      // 2. ELIMINA I DATI COLLEGATI (Profili e Tag)
      await MedicalProfile.deleteMany({ ownerId: { $in: userIds } });
      await Tag.deleteMany({ userId: { $in: userIds } });
      
      // 3. ELIMINA GLI UTENTI
      await User.deleteMany({ _id: { $in: userIds } });
      
      console.log(`✅ Cron job completato: ${userIds.length} account e tutti i loro dati sono stati eliminati.`);
    } else {
      console.log('✅ Cron job completato: nessun account da eliminare.');
    }

  } catch (error) {
    console.error('🔴 Errore durante il cron job di pulizia:', error);
  }
}, {
  scheduled: true,
  timezone: "Europe/Rome"
});

// --- Avvio del Server ---
app.listen(PORT, () => {
  console.log(`✅ S.O.S. Helmet backend attivo su http://localhost:${PORT}`);
});