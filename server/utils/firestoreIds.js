const { getFirestore } = require('../config/firestore');

// Generate incremental numeric IDs per collection name using Firestore transactions
async function getNextId(collectionName) {
  const db = getFirestore();
  const ref = db.collection('_counters').doc(collectionName);
  let nextId;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      nextId = 1;
      tx.set(ref, { nextId: 2 });
    } else {
      const data = snap.data();
      nextId = data.nextId || 1;
      tx.update(ref, { nextId: nextId + 1 });
    }
  });
  return nextId;
}

module.exports = { getNextId };
