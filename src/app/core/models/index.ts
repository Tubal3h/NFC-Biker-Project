// in src/app/core/models/index.ts
// Questo file riesporta tutte le interfacce, creando un unico punto di accesso.

export * from './api-response.model';
export * from './user.model';
export * from './nfc-tag.model';
export * from './emergency-contact.model';
// Ora esportiamo correttamente TUTTO da medical-data.model.ts
export * from './medical-data.model';