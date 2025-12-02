const { getFirestore } = require('../config/firestore');
const { getNextId } = require('../utils/firestoreIds');

function normalize(doc) {
  if (!doc) return null;
  return {
    ...doc,
    id: typeof doc.id === 'string' ? parseInt(doc.id, 10) || doc.id : doc.id,
    mentorshipId: typeof doc.mentorshipId === 'string' ? parseInt(doc.mentorshipId, 10) || doc.mentorshipId : doc.mentorshipId,
    mentorId: typeof doc.mentorId === 'string' ? parseInt(doc.mentorId, 10) || doc.mentorId : doc.mentorId,
    menteeId: typeof doc.menteeId === 'string' ? parseInt(doc.menteeId, 10) || doc.menteeId : doc.menteeId,
  };
}

const fsRepo = {
  col() {
    return getFirestore().collection('mentorship_sessions');
  },
  async create({ mentorshipId, mentorId, menteeId, title, description, scheduledAt, duration = 60, meetingType = 'video', status = 'scheduled' }) {
    const id = await getNextId('mentorship_sessions');
    const nowIso = new Date().toISOString();
    const payload = {
      id,
      mentorshipId,
      mentorId,
      menteeId,
      title: title || null,
      description: description || null,
      scheduledAt: new Date(scheduledAt).toISOString(),
      duration: Number(duration) || 60,
      meetingType: meetingType || 'video',
      status,
      mentorNotes: null,
      menteeNotes: null,
      rating: null,
      feedback: null,
      cancelledAt: null,
      cancellationReason: null,
      completedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await this.col().doc(String(id)).set(payload);
    return normalize(payload);
  },
  async findByIdForUser(id, userId) {
    const snap = await this.col().doc(String(id)).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (data.mentorId !== userId && data.menteeId !== userId) return null;
    return normalize({ id: snap.id, ...data });
  },
  async updateByIdForUser(id, userId, updates) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    const nowIso = new Date().toISOString();
    const payload = { ...updates, updatedAt: nowIso };
    await this.col().doc(String(id)).set(payload, { merge: true });
    const snap = await this.col().doc(String(id)).get();
    return normalize({ id: snap.id, ...snap.data() });
  },
  async findAndCountByUser({ userId, status, upcoming = false, limit = 10, page = 1 }) {
    // Firestore limitation: OR on different fields requires multiple queries
    const q1 = await this.col().where('mentorId', '==', userId).get();
    const q2 = await this.col().where('menteeId', '==', userId).get();
    const now = new Date();
    let rows = [...q1.docs, ...q2.docs]
      .map(d => normalize({ id: d.id, ...d.data() }));

    // Deduplicate by id
    const seen = new Map();
    rows.forEach(r => { seen.set(String(r.id), r); });
    rows = Array.from(seen.values());

    if (status) {
      const statuses = String(status).includes(',') ? String(status).split(',') : [String(status)];
      rows = rows.filter(r => statuses.includes(r.status));
    }

    if (String(upcoming) === 'true') {
      rows = rows.filter(r => r.scheduledAt && new Date(r.scheduledAt) >= now);
    }

    // Sort
    rows.sort((a, b) => {
      const da = new Date(a.scheduledAt || 0).getTime();
      const db = new Date(b.scheduledAt || 0).getTime();
      if (String(upcoming) === 'true') {
        return da - db; // ascending upcoming
      }
      return db - da; // descending default
    });

    const count = rows.length;
    const offset = (page - 1) * limit;
    const paged = rows.slice(offset, offset + Number(limit));
    return { rows: paged, count };
  },
  async aggregateStatsByUser(userId) {
    const q1 = await this.col().where('mentorId', '==', userId).get();
    const q2 = await this.col().where('menteeId', '==', userId).get();
    const rows = [...q1.docs, ...q2.docs]
      .map(d => normalize({ id: d.id, ...d.data() }));

    const stats = {
      total: 0,
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      in_progress: 0,
    };

    const seen = new Set();
    for (const r of rows) {
      const key = String(r.id);
      if (seen.has(key)) continue;
      seen.add(key);
      stats.total += 1;
      if (typeof stats[r.status] === 'number') stats[r.status] += 1;
    }
    return stats;
  }
};

module.exports = fsRepo;
