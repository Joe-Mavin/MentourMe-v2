const { getFirestore } = require('../config/firestore');
const { Newsletter } = require('../models');

const BACKEND = process.env.NEWSLETTER_BACKEND || process.env.DATA_BACKEND || 'sql'; // 'sql' | 'firestore'

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

// SQL implementation
const sqlRepo = {
  async findByEmail(email) {
    const row = await Newsletter.findOne({ where: { email } });
    return row ? normalize(row.get({ plain: true })) : null;
  },
  async create(email) {
    const row = await Newsletter.create({
      email,
      isActive: true,
      subscribedAt: new Date(),
    });
    return normalize(row.get({ plain: true }));
  },
  async reactivate(email) {
    const row = await Newsletter.findOne({ where: { email } });
    if (!row) return null;
    await row.update({ isActive: true, unsubscribedAt: null });
    return normalize(row.get({ plain: true }));
  },
  async deactivate(email) {
    const row = await Newsletter.findOne({ where: { email } });
    if (!row) return null;
    await row.update({ isActive: false, unsubscribedAt: new Date() });
    return normalize(row.get({ plain: true }));
  },
};

// Firestore implementation
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

const repo = BACKEND === 'firestore' ? fsRepo : sqlRepo;

module.exports = repo;
