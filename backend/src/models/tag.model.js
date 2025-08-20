// in backend/src/models/tag.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
    // L'_id è gestito automaticamente da MongoDB e sarà la nostra chiave primaria.
    nfcId: { 
        type: String, 
        required: true, 
        unique: true // La regola di unicità va qui!
    },
    alias: {
        type: String,
        default: null // Sarà null finché l'utente non gli dà un nome
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id; // Crea un campo virtuale 'id'
            delete ret._id;
            delete ret.__v;
        }
    }
});

const Tag = mongoose.model('Tag', tagSchema);
module.exports = Tag;