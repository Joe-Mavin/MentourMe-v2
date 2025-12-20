const { getFirestore } = require('../config/firestore');
const { getNextId } = require('../utils/firestoreIds');

const fsRepo = {
  col() {
    return getFirestore().collection('mentorship_requests');
  },
  async findById(id) {
    const d = await this.col().doc(String(id)).get();
    if (!d.exists) return null;
    return { id: d.id, ...d.data() };
  },
  async create({ mentorId, menteeId, message = null, matchScore = null, status = 'pending', expiresAt = null, mentorNotes = null }) {
    const id = await getNextId('mentorship_requests');
    const nowIso = new Date().toISOString();
    const payload = {
      id,
      mentorId,
      menteeId,
      message,
      matchScore,
      status,
      mentorNotes,
      requestedAt: nowIso,
      respondedAt: null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await this.col().doc(String(id)).set(payload);
    return { ...payload };
  },
  async updateById(id, updates) {
    const nowIso = new Date().toISOString();
    const data = { ...updates, updatedAt: nowIso };
    await this.col().doc(String(id)).set(data, { merge: true });
    const d = await this.col().doc(String(id)).get();
    if (!d.exists) return null;
    return { id: d.id, ...d.data() };
  },
  async findPendingBetweenUsers(mentorId, menteeId) {
    const q = await this.col()
      .where('mentorId', '==', mentorId)
      .where('menteeId', '==', menteeId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    if (q.empty) return null;
    const d = q.docs[0];
    return { id: d.id, ...d.data() };
  },
  async findAcceptedBetweenUsers(userAId, userBId) {
    // Try mentor=userA, mentee=userB
    const q1 = await this.col()
      .where('mentorId', '==', userAId)
      .where('menteeId', '==', userBId)
      .where('status', '==', 'accepted')
      .limit(1)
      .get();
    if (!q1.empty) {
      const d = q1.docs[0];
      return { id: d.id, ...d.data() };
    }
    // Try mentor=userB, mentee=userA
    const q2 = await this.col()
      .where('mentorId', '==', userBId)
      .where('menteeId', '==', userAId)
      .where('status', '==', 'accepted')
      .limit(1)
      .get();
    if (!q2.empty) {
      const d = q2.docs[0];
      return { id: d.id, ...d.data() };
    }
    return null;
  },
};

module.exports = fsRepo;
