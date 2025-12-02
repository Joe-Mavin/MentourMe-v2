const admin = require('firebase-admin');

let app;

function initFirebase() {
  if (admin.apps.length) {
    return admin.app();
  }

  // Prefer explicit credentials from env vars when provided
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private key may have escaped newlines
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    if (projectId && clientEmail && privateKey) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      // eslint-disable-next-line no-console
      console.log('🔥 Firebase initialized with explicit credentials');
    } else {
      // Fallback to ADC (Workload Identity on Cloud Run)
      app = admin.initializeApp();
      // eslint-disable-next-line no-console
      console.log('🔥 Firebase initialized with Application Default Credentials');
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK:', err);
    throw err;
  }

  return app;
}

function getFirestore() {
  const appInstance = initFirebase();
  const db = admin.firestore(appInstance);
  // Recommended setting to avoid errors on undefined
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

module.exports = { admin, getFirestore };
