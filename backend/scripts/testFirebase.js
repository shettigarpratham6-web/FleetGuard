const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const admin = require('../src/config/firebaseAdmin');

async function testFirebaseConnection() {
  console.log('--- Firebase Credentials Detection ---');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? `SET (${process.env.FIREBASE_PROJECT_ID})` : 'NOT SET');
  console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? `SET (${process.env.FIREBASE_CLIENT_EMAIL})` : 'NOT SET');
  console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET (Length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'NOT SET');
  console.log('FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'SET' : 'NOT SET');
  console.log('FIREBASE_SERVICE_ACCOUNT_PATH:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? 'SET' : 'NOT SET');
  console.log('-------------------------------------\n');

  try {
    // Attempt to communicate with Firebase Auth API (listing up to 1 user)
    const listUsersResult = await admin.auth().listUsers(1);
    
    console.log('✅ SUCCESS! Firebase Admin SDK connected successfully!');
    console.log(`Verified Firebase Users in project: ${listUsersResult.users.length}`);
  } catch (error) {
    console.error('❌ Connection Failed!');
    console.error('Error Code:', error.code || 'UNKNOWN');
    console.error('Error Message:', error.message);
  } finally {
    process.exit();
  }
}

testFirebaseConnection();
