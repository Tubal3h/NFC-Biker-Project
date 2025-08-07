const mongoose = require('mongoose');
const fs = require('fs');

// Connection string Atlas (modifica con la tua!)
const uri = 'mongodb+srv://2bal3h:RLrNwydoWlfN2O4Y@sos-helmet-cluster.nsfk39h.mongodb.net/?retryWrites=true&w=majority&appName=sos-helmet-cluster';

// Schemi Mongoose
const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  password: String,
  name: String,
  surname: String,
  premium: Boolean,
  nfcTags: [String],
  medicalData: {
    bloodType: String,
    allergies: String,
    conditions: String,
    notes: String,
    emergencyContacts: [
      {
        name: String,
        relation: String,
        phone: String,
      },
    ],
  },
});

const tagSchema = new mongoose.Schema({
  id: String,
  userId: String,
});

const User = mongoose.model('User', userSchema);
const Tag = mongoose.model('Tag', tagSchema);

// Leggi il file JSON
const rawData = fs.readFileSync('db.json');
const data = JSON.parse(rawData);

async function importData() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Pulisci le collections (opzionale: solo se vuoi azzerare tutto)
    await User.deleteMany({});
    await Tag.deleteMany({});

    // Importa utenti e tags
    await User.insertMany(data.users);
    await Tag.insertMany(data.tags);

    console.log('Importazione completata con successo!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

importData();
