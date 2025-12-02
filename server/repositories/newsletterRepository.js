const { getFirestore } = require('../config/firestore');

// Normalize a record to common shape
function normalize(record) {
  if (!record) return null;
  return {
    id: record.id || record.email,
    email: record.email,
    isActive: !!record.isActive,
    subscribedAt: record.subscribedAt ? new Date(record.subscribedAt) : null,
    unsubscribedAt: record.unsubscribedAt ? new Date(record.unsubscribedAt) : null,
  };
}

// Firestore implementation (Firestorm-only)
const fsRepo = {
  col() {
    const db = getFirestore();
    return db.collection('newsletters');
  },
  async findByEmail(email) {
    const snap = await this.col().doc(email).get();
    if (!snap.exists) return null;
    const data = snap.data();
    return normalize({ id: snap.id, ...data });
  },
  async create(email) {
    const now = new Date();
    await this.col().doc(email).set({
      email,
      isActive: true,
      subscribedAt: now.toISOString(),
      unsubscribedAt: null,
    }, { merge: true });
    return normalize({ email, isActive: true, subscribedAt: now });
  },
  async reactivate(email) {
    await this.col().doc(email).set({
      isActive: true,
      unsubscribedAt: null,
    }, { merge: true });
    return this.findByEmail(email);
  },
  async deactivate(email) {
    const now = new Date();
    await this.col().doc(email).set({
      isActive: false,
      unsubscribedAt: now.toISOString(),
    }, { merge: true });
    return this.findByEmail(email);
  },
};

module.exports = fsRepo;
