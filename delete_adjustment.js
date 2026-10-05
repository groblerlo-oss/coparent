const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAdjustment() {
  try {
    // Query for all adjustments with "Lawyer fees" in the name
    const snapshot = await db.collectionGroup('adjustments')
      .where('name', '==', 'Lawyer fees')
      .get();
    
    console.log(`Found ${snapshot.docs.length} adjustments to delete`);
    
    for (const doc of snapshot.docs) {
      console.log(`Deleting adjustment: ${doc.id}`);
      await doc.ref.delete();
    }
    
    console.log('Deletion complete');
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAdjustment();
