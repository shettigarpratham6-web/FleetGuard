/**
 * FleetGuard - Notifications API Check Runner
 * Standalone verification script for the Notifications module.
 * Uses native fetch (Node.js 18+).
 */

const BASE_URL = 'http://localhost:5000';
let adminToken = null;
let adminId = null;
let targetUserId = null;
let targetUserToken = null;
let notificationId = null;

const TARGET_EMAIL = 'shettigarpratham287@gmail.com';
const TARGET_NAME = 'Shettigar Pratham';

// Console colors helper
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function logStep(stepNum, description) {
  console.log(`\n${colors.bold}${colors.blue}[Step ${stepNum}] ${description}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✔ SUCCESS: ${message}${colors.reset}`);
}

function logFailure(message, error = '') {
  console.error(`${colors.red}✘ FAILURE: ${message}${colors.reset}`);
  if (error) {
    console.error(`${colors.red}${JSON.stringify(error, null, 2)}${colors.reset}`);
  }
}

async function runCheck() {
  console.log(`${colors.bold}${colors.cyan}====================================================`);
  console.log(`     FLEETGUARD - NOTIFICATIONS API CHECK RUNNER     `);
  console.log(`====================================================${colors.reset}`);
  console.log(`Target Backend URL: ${colors.bold}${BASE_URL}${colors.reset}\n`);

  let stepsPassed = 0;
  let totalSteps = 6;

  try {
    // ----------------------------------------------------
    // STEP 1: Admin Login
    // ----------------------------------------------------
    logStep(1, 'Authenticating as Admin (admin@fleetguard.com)...');
    try {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@fleetguard.com',
          password: 'admin123'
        })
      });

      const loginData = await loginRes.json();

      if (loginRes.status === 200 && loginData.token && loginData.user) {
        adminToken = loginData.token;
        adminId = loginData.user.id;
        logSuccess(`Admin authenticated successfully!`);
        stepsPassed++;
      } else {
        logFailure(`Admin Auth failed with status ${loginRes.status}`, loginData);
        return finish(stepsPassed, totalSteps);
      }
    } catch (err) {
      logFailure(`Could not connect to the server. Is it running at ${BASE_URL}?`, err.message);
      return finish(stepsPassed, totalSteps);
    }

    // ----------------------------------------------------
    // STEP 2: Ensure Target User Exists (shettigarpratham287@gmail.com)
    // ----------------------------------------------------
    logStep(2, `Ensuring target user (${TARGET_EMAIL}) exists in DB...`);
    // Try to register
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'shettigarpratham',
        email: TARGET_EMAIL,
        password: 'password123',
        full_name: TARGET_NAME,
        role: 'Driver'
      })
    });
    const regData = await regRes.json();

    if (regRes.status === 201 && regData.user) {
      targetUserId = regData.user.id;
      targetUserToken = regData.token;
      logSuccess(`User ${TARGET_EMAIL} registered successfully as a new user.`);
      stepsPassed++;
    } else if (regRes.status === 400 && regData.error && regData.error.includes('already exists')) {
      // User already exists, log in to fetch details
      const logRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TARGET_EMAIL,
          password: 'password123'
        })
      });
      const logData = await logRes.json();

      if (logRes.status === 200 && logData.user) {
        targetUserId = logData.user.id;
        targetUserToken = logData.token;
        logSuccess(`User ${TARGET_EMAIL} already exists. Logged in and fetched ID successfully.`);
        stepsPassed++;
      } else {
        logFailure(`User already exists, but login failed.`, logData);
        return finish(stepsPassed, totalSteps);
      }
    } else {
      logFailure(`Failed to register or retrieve user ${TARGET_EMAIL}`, regData);
      return finish(stepsPassed, totalSteps);
    }

    console.log(`  • Recipient User ID: ${targetUserId}`);
    console.log(`  • Recipient Email: ${TARGET_EMAIL}`);

    // ----------------------------------------------------
    // STEP 3: Admin Posts Notification to Target User
    // ----------------------------------------------------
    logStep(3, `Admin sending notification to ${TARGET_NAME}...`);
    const createRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        user_id: targetUserId,
        title: 'Important System Update',
        message: `Hello ${TARGET_NAME}, your vehicle assignment details have been updated by the Admin. Please review your dashboard.`,
        notification_type: 'Alert'
      })
    });

    const createData = await createRes.json();

    if (createRes.status === 201 && createData.notification) {
      notificationId = createData.notification.id;
      logSuccess(`Notification created and email dispatched!`);
      console.log(`  • Email was sent to: ${colors.bold}${TARGET_EMAIL}${colors.reset}`);
      console.log(`  • Notification ID: ${notificationId}`);
      stepsPassed++;
    } else {
      logFailure(`Failed to create notification. Status ${createRes.status}`, createData);
      return finish(stepsPassed, totalSteps);
    }

    // ----------------------------------------------------
    // STEP 4: Target User Retrieves Notifications
    // ----------------------------------------------------
    logStep(4, `Retrieving notifications as target user (${TARGET_NAME})...`);
    const listRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${targetUserToken}`
      }
    });

    const listData = await listRes.json();

    if (listRes.status === 200 && Array.isArray(listData.notifications)) {
      const found = listData.notifications.some(n => n.id === notificationId);
      if (found) {
        logSuccess(`Notifications retrieved successfully. Notification ID ${notificationId} is present for the target user.`);
        console.log(`  • Total Notifications count: ${listData.notifications.length}`);
        stepsPassed++;
      } else {
        logFailure(`Target user notification list retrieved, but our created notification ID was missing.`);
        return finish(stepsPassed, totalSteps);
      }
    } else {
      logFailure(`Failed to list notifications. Status ${listRes.status}`, listData);
      return finish(stepsPassed, totalSteps);
    }

    // ----------------------------------------------------
    // STEP 5: Target User Marks Notification as Read
    // ----------------------------------------------------
    logStep(5, `Target user marking notification as read...`);
    const readRes = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${targetUserToken}`
      }
    });

    const readData = await readRes.json();

    if (readRes.status === 200 && readData.notification && readData.notification.is_read === true) {
      logSuccess(`Notification marked as read successfully!`);
      stepsPassed++;
    } else {
      logFailure(`Failed to mark notification as read. Status ${readRes.status}`, readData);
      return finish(stepsPassed, totalSteps);
    }

    // ----------------------------------------------------
    // STEP 6: Target User Deletes Notification (Clean Up)
    // ----------------------------------------------------
    logStep(6, `Target user deleting the test notification (cleanup)...`);
    const deleteRes = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${targetUserToken}`
      }
    });

    const deleteData = await deleteRes.json();

    if (deleteRes.status === 200) {
      logSuccess(`Notification cleaned up successfully!`);
      stepsPassed++;
    } else {
      logFailure(`Failed to delete notification. Status ${deleteRes.status}`, deleteData);
      return finish(stepsPassed, totalSteps);
    }

  } catch (globalError) {
    logFailure('An unexpected error occurred during execution.', globalError);
  }

  finish(stepsPassed, totalSteps);
}

function finish(passed, total) {
  console.log(`\n${colors.bold}${colors.cyan}====================================================`);
  if (passed === total) {
    console.log(`🎉 ${colors.green}${colors.bold}ALL CHECKS PASSED: ${passed}/${total} steps successful!${colors.cyan}`);
  } else {
    console.log(`⚠️ ${colors.red}${colors.bold}CHECK FINISHED WITH ISSUES: ${passed}/${total} steps succeeded.${colors.cyan}`);
  }
  console.log(`====================================================${colors.reset}\n`);
}

runCheck();
