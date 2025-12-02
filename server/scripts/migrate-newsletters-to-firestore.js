require('dotenv').config();

(async () => {
  const { sequelize, Newsletter } = require('../models');
  const { getFirestore } = require('../config/firestore');

  try {
    console.log('🚀 Starting newsletters migration to Firestore...');
    await sequelize.authenticate();
    console.log('✅ SQL connection OK');

    const db = getFirestore();
    const col = db.collection('newsletters');

    const rows = await Newsletter.findAll();
    console.log(`📦 Found ${rows.length} newsletter records to migrate`);

    let migrated = 0;
    for (const row of rows) {
      const r = row.get({ plain: true });
      const payload = {
        email: r.email,
        isActive: !!r.isActive,
        subscribedAt: r.subscribedAt ? new Date(r.subscribedAt).toISOString() : null,
        unsubscribedAt: r.unsubscribedAt ? new Date(r.unsubscribedAt).toISOString() : null,
      };
      await col.doc(r.email).set(payload, { merge: true });
      migrated++;
      if (migrated % 100 === 0) console.log(`... ${migrated}/${rows.length} migrated`);
    }

    console.log(`🎉 Migration complete. Migrated ${migrated} newsletters to Firestore.`);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exitCode = 1;
  } finally {
    try { await sequelize.close(); } catch (_) {}
  }
})();
