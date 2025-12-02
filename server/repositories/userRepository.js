const { getFirestore } = require('../config/firestore');
const bcrypt = require('bcryptjs');
const { getNextId } = require('../utils/firestoreIds');

const BACKEND = 'firestore';

function sanitize(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function normalize(doc) {
  if (!doc) return null;
  return { ...doc, id: typeof doc.id === 'string' ? parseInt(doc.id, 10) || doc.id : doc.id };
}

const fsRepo = {
  col() {
    return getFirestore().collection('users');
  },
  async findByEmail(email) {
    const snap = await this.col().where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data();
    return normalize({ id: d.id, ...data });
  },
  async findById(id) {
    const d = await this.col().doc(String(id)).get();
    if (!d.exists) return null;
    return normalize({ id: d.id, ...d.data() });
  },
  async create({ name, email, password, role = 'user', phone, bio }) {
    const id = await getNextId('users');
    const nowIso = new Date().toISOString();
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    const doc = {
      role,
      name,
      email,
      password: hashed,
      phone: phone || null,
      avatar: null,
      bio: bio || null,
      approved: role !== 'mentor',
      isActive: true,
      lastLogin: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await this.col().doc(String(id)).set(doc);
    return normalize({ id, ...doc });
  },
  async updateById(id, updates) {
    const nowIso = new Date().toISOString();
    const data = { ...updates, updatedAt: nowIso };
    if (updates.password) {
      const salt = await bcrypt.genSalt(12);
      data.password = await bcrypt.hash(updates.password, salt);
    }
    await this.col().doc(String(id)).set(data, { merge: true });
    const d = await this.col().doc(String(id)).get();
    return normalize({ id: d.id, ...d.data() });
  },
  async findAndCountAll({ q, role, limit = 20, page = 1 }) {
    // Basic filtering: role and isActive in query, name/email search in memory
    let query = this.col().where('isActive', '==', true);
    if (role) query = query.where('role', '==', role === 'mentee' ? 'user' : role);
    const snap = await query.get();
    let rows = snap.docs.map(d => normalize({ id: d.id, ...d.data() }));
    if (q && q.trim().length >= 2) {
      const s = q.trim().toLowerCase();
      rows = rows.filter(r => (r.name && r.name.toLowerCase().includes(s)) || (r.email && r.email.toLowerCase().includes(s)));
    }
    rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const count = rows.length;
    const offset = (page - 1) * limit;
    rows = rows.slice(offset, offset + Number(limit));
    return { rows, count };
  },
  async comparePassword(user, candidatePassword) {
    if (!user || !user.password) return false;
    return bcrypt.compare(candidatePassword, user.password);
  },
};

module.exports = { ...fsRepo, sanitize };
