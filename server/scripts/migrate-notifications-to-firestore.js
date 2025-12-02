require('dotenv').config();

(async () => {
  const { sequelize, Notification } = require('../models');
  const { getFirestore } = require('../config/firestore');

  try {
    console.log('🚀 Starting notifications migration to Firestore...');
    await sequelize.authenticate();
    console.log('✅ SQL connection OK');

    const db = getFirestore();
    const col = db.collection('notifications');

    const rows = await Notification.findAll();
    console.log(`📦 Found ${rows.length} notifications to migrate`);

    let migrated = 0;
    for (const row of rows) {
      const r = row.get({ plain: true });
      const id = String(r.id);
      const payload = {
        id,
        userId: r.userId,
        type: r.type,
        title: r.title,
        message: r.message,
        priority: r.priority,
        actionUrl: r.actionUrl || null,
        data: r.data || null,
        isRead: !!r.isRead,
        readAt: r.readAt ? new Date(r.readAt).toISOString() : null,
        expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      };
      await col.doc(id).set(payload, { merge: true });
      migrated++;
      if (migrated % 250 === 0) console.log(`... ${migrated}/${rows.length} migrated`);
    }

    console.log(`🎉 Migration complete. Migrated ${migrated} notifications to Firestore.`);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exitCode = 1;
  } finally {
    try { await sequelize.close(); } catch (_) {}
  }
})();
