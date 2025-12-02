const { getFirestore } = require('../config/firestore');

const fsRepo = {
  col() {
    return getFirestore().collection('mentorship_requests');
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
