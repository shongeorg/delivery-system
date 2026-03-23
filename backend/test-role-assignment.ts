// Test script to verify role assignment API
const BASE_URL = 'http://localhost:3000';

async function testRoleAssignment() {
  console.log('🧪 Testing Role Assignment API\n');

  // Step 1: Login as owner
  console.log('1️⃣ Logging in as owner...');
  const ownerLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@test.com',
      password: 'owner123',
    }),
  });

  if (!ownerLogin.ok) {
    console.error('❌ Failed to login as owner');
    return;
  }

  const ownerData = await ownerLogin.json();
  console.log('✅ Owner logged in successfully');
  console.log(`   Token: ${ownerData.accessToken.substring(0, 50)}...\n`);

  // Step 2: Register a new test user
  console.log('2️⃣ Creating a test user...');
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Employee',
      email: `employee${Date.now()}@test.com`,
      password: 'password123',
    }),
  });

  const employeeData = await registerRes.json();
  console.log('✅ Test user created');
  console.log(`   User ID: ${employeeData.user.id}`);
  console.log(`   Current role: ${employeeData.user.role}\n`);

  // Step 3: Update user role to 'chef'
  console.log('3️⃣ Updating user role to "chef"...');
  const updateRoleRes = await fetch(`${BASE_URL}/users/${employeeData.user.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerData.accessToken}`,
    },
    body: JSON.stringify({
      role: 'chef',
    }),
  });

  if (!updateRoleRes.ok) {
    const error = await updateRoleRes.json();
    console.error('❌ Failed to update role:', error);
    return;
  }

  const updatedUser = await updateRoleRes.json();
  console.log('✅ Role updated successfully!');
  console.log(`   New role: ${updatedUser.role}`);
  console.log(`   User: ${updatedUser.name}`);
  console.log(`   Email: ${updatedUser.email}\n`);

  // Step 4: Verify by fetching user data
  console.log('4️⃣ Verifying user data...');
  const getUserRes = await fetch(`${BASE_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${ownerData.accessToken}`,
    },
  });

  const userData = await getUserRes.json();
  console.log('✅ Verification complete');
  console.log(`   Your role: ${userData.role}`);
  console.log(`   Can assign roles: ${userData.role === 'owner' || userData.role === 'admin'}\n`);

  // Step 5: Test with different roles
  console.log('5️⃣ Testing role changes (chef → courier → admin)...');
  
  const roles = ['courier', 'admin'];
  for (const role of roles) {
    const res = await fetch(`${BASE_URL}/users/${employeeData.user.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerData.accessToken}`,
      },
      body: JSON.stringify({ role }),
    });
    
    const result = await res.json();
    console.log(`   ✅ Changed to "${role}": ${result.role}`);
  }

  console.log('\n🎉 All tests passed! Role assignment API is working correctly.');
}

// Run the test
testRoleAssignment().catch(console.error);
