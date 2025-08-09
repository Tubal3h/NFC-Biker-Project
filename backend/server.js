const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Carica le variabili dal file .env
const bcrypt = require('bcryptjs');

// Importiamo i nostri nuovi modelli Mongoose
const User = require('./src/models/user.model.js');
const Tag = require('./src/models/tag.model.js');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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
    // Il tuo codice per controllare l'utente esistente è già perfetto...
    const { email, password, name, surname } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email già registrata' });
    }
    
    // --- NUOVA LOGICA DI SICUREZZA ---
    // 1. Genera un "salt": una stringa casuale da mescolare alla password
    const salt = await bcrypt.genSalt(10);
    // 2. "Hasha" la password mescolandola con il salt
    const hashedPassword = await bcrypt.hash(password, salt);
    // ------------------------------------

    const newUser = new User({
      name,
      surname,
      email,
      password: hashedPassword, // 3. Salva la password criptata, non quella in chiaro!
      medicalData: { emergencyContacts: [] }
    });

    const savedUser = await newUser.save();
    
    const { password: _, ...userToReturn } = savedUser.toObject();
    res.status(201).json({ success: true, data: userToReturn });

  } catch (error) {
    console.error("Errore durante la registrazione:", error); // Aggiungi un log per il debug
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Troviamo l'utente e includiamo la password nella ricerca
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    }
    
    // --- ECCO LA PARTE FONDAMENTALE ---
    // Prima di restituire l'utente, ci assicuriamo che abbia tutti i campi necessari.
    // Il '.toObject()' converte il documento Mongoose in un oggetto JS pulito.
    const userObject = user.toObject();

    // Rimuoviamo la password per sicurezza
    delete userObject.password;
     userObject.name = userObject.name || '';
    userObject.surname = userObject.surname || '';
    
    // Restituiamo l'intero oggetto utente aggiornato
    res.json({ success: true, data: userObject });

  } catch (error) {
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
    // Ora cerchiamo sul campo 'nfcId'
    const tag = await Tag.findOne({ nfcId: req.params.nfcId });
    if (!tag) return res.status(404).json({ success: false, error: 'Tag non valido' });
    res.json({ success: true, data: tag });
  } catch (error) { res.status(500).json({ success: false, error: 'Errore server' }); }
});

// Claim casco/NFC
app.post('/api/claim', async (req, res) => {
  try {
    const { nfcId, userId } = req.body;
    
    // Usiamo findById per l'utente, che cerca tramite _id ObjectId
    const user = await User.findById(userId);
    // Usiamo findOne per il tag, che cerca tramite il nostro nfcId personalizzato
    const tag = await Tag.findOne({ nfcId: nfcId });

    if (!user) return res.status(404).json({ success: false, error: 'Utente non trovato' });
    if (!tag) return res.status(404).json({ success: false, error: 'Tag non trovato' });
    if (tag.userId) return res.status(400).json({ success: false, error: 'Tag già associato' });

    if (!user.premium && user.nfcTags.length >= 1) {
      return res.status(403).json({ error: 'Limite massimo raggiunto.' });
    }

    // --- LA CORREZIONE FONDAMENTALE ---
    // Assegniamo l'ObjectId completo dell'utente, non la sua versione in stringa.
    tag.userId = user._id; 
    // Aggiungiamo l'ObjectId del tag all'array dell'utente.
    user.nfcTags.push(tag._id);
    
    // Salviamo entrambi i documenti aggiornati
    await tag.save();
    await user.save();

    res.json({ success: true, data: { message: 'Tag associato con successo' } });
  } catch (error) {
    console.error("Errore durante il claim:", error);
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

// Ottieni dati sanitari
app.get('/api/user/:userId/medical', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }
    res.json({ success: true, data: user.medicalData || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

// Aggiorna dati sanitari
app.put('/api/user/:userId/medical', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }

    // Aggiorna l'oggetto medicalData con i nuovi dati
    user.medicalData = req.body;
    await user.save(); // Salva l'intero documento utente aggiornato

    res.json({ success: true, data: user.medicalData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore interno del server' });
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
    await tag.save();

    res.json({ success: true, data: { message: 'Tag dissociato con successo.' } });

  } catch (error) {
    console.error("Errore durante la dissociazione:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});


/* -------------------------------------------------------------------------- */
/*                 Endpoint per la richiesta di reset password                */
/* -------------------------------------------------------------------------- */
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Per sicurezza, non diciamo se l'email esiste o no
      return res.json({ success: true, data: { message: 'Se l\'utente esiste, riceverà un\'email di reset.' } });
    }

    // 1. Crea un token di reset segreto che scade in 1 ora
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 2. Salva il token sull'utente (richiede una modifica allo schema)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 ora in millisecondi
    await user.save();

    // 3. Invia l'email
    const resetUrl = `https://www.soshelmet.it/reset-password/${resetToken}`; // <-- Usa il tuo dominio finale!
    
    // Configura il nostro "postino" (Nodemailer) per usare SendGrid
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey', // Questo deve essere 'apikey'
        pass: process.env.SENDGRID_API_KEY
      }
    });
    
    await transporter.sendMail({
      from: `S.O.S. Helmet <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: 'Reset della tua password per S.O.S. Helmet',
      html: `
        <p>Ciao ${user.name},</p>
        <p>Abbiamo ricevuto una richiesta di reset per la tua password. Clicca sul link qui sotto per procedere. Il link è valido per 1 ora.</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>Se non hai richiesto tu il reset, ignora questa email.</p>
      `
    });

    res.json({ success: true, data: { message: 'Email di reset inviata.' } });

  } catch (error) {
    console.error("Errore in forgot-password:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

/* -------------------------------------------------------------------------- */
/*                                    EXTRA                                   */
/* -------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`S.O.S. Helmet backend attivo su http://localhost:${PORT}`);
});