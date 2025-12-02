const { getFirestore } = require('../config/firestore');

const fsRepo = {
  col() {
    return getFirestore().collection('onboarding');
  },
  async findByUserId(userId) {
    const d = await this.col().doc(String(userId)).get();
    if (!d.exists) return null;
    return { id: d.id, ...d.data() };
  },
  async upsert(userId, data) {
    const nowIso = new Date().toISOString();
    const payload = { ...data, updatedAt: nowIso };
    if (data.completedAt) payload.completedAt = new Date(data.completedAt).toISOString();
    await this.col().doc(String(userId)).set(payload, { merge: true });
    const d = await this.col().doc(String(userId)).get();
    return { id: d.id, ...d.data() };
  },
  async getAll() {
    const snap = await this.col().get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

module.exports = fsRepo;
