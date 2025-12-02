const { getFirestore } = require('../config/firestore');
const { Notification } = require('../models');
const { Op } = require('sequelize');
const { randomUUID } = require('crypto');

const BACKEND = process.env.NOTIFICATIONS_BACKEND || process.env.DATA_BACKEND || 'sql'; // 'sql' | 'firestore'

function normalize(row) {
  if (!row) return null;
  // Sequelize instance
  if (typeof row.get === 'function') {
    row = row.get({ plain: true });
  }
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    message: row.message,
    priority: row.priority,
    actionUrl: row.actionUrl || null,
    data: row.data || null,
    isRead: !!row.isRead,
    readAt: row.readAt ? new Date(row.readAt) : null,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
    createdAt: row.createdAt ? new Date(row.createdAt) : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
  };
}

// SQL repo
const sqlRepo = {
  async create(data) {
    const row = await Notification.create(data);
    return normalize(row);
  },
  async bulkCreate(list) {
    const rows = await Notification.bulkCreate(list);
    return rows.map(normalize);
  },
  async findAndCountByUser({ userId, isRead, type, page = 1, limit = 20 }) {
    const whereClause = { userId };
    if (typeof isRead === 'boolean') whereClause.isRead = isRead;
    if (type) whereClause.type = type;
    whereClause[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } },
    ];
    const offset = (page - 1) * limit;
    const result = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { rows: result.rows.map(normalize), count: result.count };
  },
  async findByIdForUser(id, userId) {
    const row = await Notification.findOne({ where: { id, userId } });
    return normalize(row);
  },
  async markAsRead(id, userId) {
    const row = await Notification.findOne({ where: { id, userId } });
    if (!row) return null;
    await row.update({ isRead: true, readAt: new Date() });
    return normalize(row);
  },
  async markAllAsRead(userId) {
    const [affected] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
    return affected;
  },
  async deleteById(id, userId) {
    const row = await Notification.findOne({ where: { id, userId } });
    if (!row) return false;
    await row.destroy();
    return true;
  },
  async countUnread(userId) {
    const whereClause = {
      userId,
      isRead: false,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
    };
    return Notification.count({ where: whereClause });
  },
  async cleanupExpired() {
    return Notification.destroy({
      where: { expiresAt: { [Op.lt]: new Date() } },
    });
  },
};

// Firestore repo
const fsRepo = {
  col() {
    return getFirestore().collection('notifications');
  },
  docRef(id) {
    return this.col().doc(id);
  },
  async create(data) {
    const id = data.id || randomUUID();
    const now = new Date();
    const payload = {
      ...data,
      id,
      isRead: !!data.isRead,
      readAt: data.readAt ? new Date(data.readAt).toISOString() : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    await this.docRef(id).set(payload, { merge: true });
    return normalize({ ...payload });
  },
  async bulkCreate(list) {
    const batch = getFirestore().batch();
    const now = new Date();
    const created = [];
    for (const item of list) {
      const id = item.id || randomUUID();
      const payload = {
        ...item,
        id,
        isRead: !!item.isRead,
        readAt: item.readAt ? new Date(item.readAt).toISOString() : null,
        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      batch.set(this.docRef(id), payload, { merge: true });
      created.push(normalize(payload));
    }
    await batch.commit();
    return created;
  },
  async findAndCountByUser({ userId, isRead, type, page = 1, limit = 20 }) {
    // Basic filtering in-memory after userId query; optimize with indexes later
    const snap = await this.col().where('userId', '==', userId).get();
    const now = new Date();
    let rows = snap.docs.map(d => normalize(d.data()));
    if (typeof isRead === 'boolean') rows = rows.filter(r => r.isRead === isRead);
    if (type) rows = rows.filter(r => r.type === type);
    rows = rows.filter(r => !r.expiresAt || new Date(r.expiresAt) > now);
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const count = rows.length;
    const offset = (page - 1) * limit;
    rows = rows.slice(offset, offset + limit);
    return { rows, count };
  },
  async findByIdForUser(id, userId) {
    const d = await this.docRef(id).get();
    if (!d.exists) return null;
    const data = normalize(d.data());
    return data.userId === userId ? data : null;
  },
  async markAsRead(id, userId) {
    const d = await this.docRef(id).get();
    if (!d.exists) return null;
    const data = d.data();
    if (data.userId !== userId) return null;
    const updated = { ...data, isRead: true, readAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await this.docRef(id).set(updated, { merge: true });
    return normalize(updated);
  },
  async markAllAsRead(userId) {
    const snap = await this.col().where('userId', '==', userId).where('isRead', '==', false).get();
    const batch = getFirestore().batch();
    let count = 0;
    const nowIso = new Date().toISOString();
    snap.forEach(doc => {
      batch.set(doc.ref, { isRead: true, readAt: nowIso, updatedAt: nowIso }, { merge: true });
      count++;
    });
    await batch.commit();
    return count;
  },
  async deleteById(id, userId) {
    const d = await this.docRef(id).get();
    if (!d.exists) return false;
    const data = d.data();
    if (data.userId !== userId) return false;
    await this.docRef(id).delete();
    return true;
  },
  async countUnread(userId) {
    const snap = await this.col().where('userId', '==', userId).where('isRead', '==', false).get();
    const now = new Date();
    let count = 0;
    snap.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      if (!expiresAt || expiresAt > now) count++;
    });
    return count;
  },
  async cleanupExpired() {
    const nowIso = new Date().toISOString();
    const snap = await this.col().where('expiresAt', '<', nowIso).get();
    const batch = getFirestore().batch();
    let count = 0;
    snap.forEach(doc => { batch.delete(doc.ref); count++; });
    await batch.commit();
    return count;
  },
};

const repo = BACKEND === 'firestore' ? fsRepo : sqlRepo;
module.exports = repo;
