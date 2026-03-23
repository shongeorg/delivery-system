// Script to create users and assign courier roles
const BASE_URL = 'http://localhost:3000';

async function createUsersAndAssignRoles() {
  console.log('🚀 Creating users and assigning courier roles\n');

  // Step 1: Login as admin
  console.log('1️⃣ Logging in as admin...');
  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'admin123',
    }),
  });

  if (!adminLogin.ok) {
    console.error('❌ Failed to login as admin');
    return;
  }

  const adminData = await adminLogin.json();
  console.log('✅ Admin logged in successfully');
  console.log(`   Token: ${adminData.accessToken.substring(0, 50)}...\n`);

  // Step 2: Create first user (cura1@mail.com)
  console.log('2️⃣ Creating cura1@mail.com...');
  const user1Register = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Curier 1',
      email: 'cura1@mail.com',
      password: 'cura123',
      phone: '+380501111111',
    }),
  });

  if (!user1Register.ok) {
    const error = await user1Register.json();
    console.error('❌ Failed to create user 1:', error);
    return;
  }

  const user1Data = await user1Register.json();
  console.log('✅ User 1 created successfully');
  console.log(`   ID: ${user1Data.user.id}`);
  console.log(`   Name: ${user1Data.user.name}`);
  console.log(`   Email: ${user1Data.user.email}`);
  console.log(`   Current role: ${user1Data.user.role}\n`);

  // Step 3: Create second user (cura2@mail.com)
  console.log('3️⃣ Creating cura2@mail.com...');
  const user2Register = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Curier 2',
      email: 'cura2@mail.com',
      password: 'cura123',
      phone: '+380502222222',
    }),
  });

  if (!user2Register.ok) {
    const error = await user2Register.json();
    console.error('❌ Failed to create user 2:', error);
    return;
  }

  const user2Data = await user2Register.json();
  console.log('✅ User 2 created successfully');
  console.log(`   ID: ${user2Data.user.id}`);
  console.log(`   Name: ${user2Data.user.name}`);
  console.log(`   Email: ${user2Data.user.email}`);
  console.log(`   Current role: ${user2Data.user.role}\n`);

  // Step 4: Assign courier role to user 1
  console.log('4️⃣ Assigning courier role to cura1@mail.com...');
  const updateUser1Role = await fetch(`${BASE_URL}/users/${user1Data.user.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminData.accessToken}`,
    },
    body: JSON.stringify({
      role: 'courier',
    }),
  });

  if (!updateUser1Role.ok) {
    const error = await updateUser1Role.json();
    console.error('❌ Failed to update user 1 role:', error);
    return;
  }

  const updatedUser1 = await updateUser1Role.json();
  console.log('✅ Role updated for user 1');
  console.log(`   New role: ${updatedUser1.role}\n`);

  // Step 5: Assign courier role to user 2
  console.log('5️⃣ Assigning courier role to cura2@mail.com...');
  const updateUser2Role = await fetch(`${BASE_URL}/users/${user2Data.user.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminData.accessToken}`,
    },
    body: JSON.stringify({
      role: 'courier',
    }),
  });

  if (!updateUser2Role.ok) {
    const error = await updateUser2Role.json();
    console.error('❌ Failed to update user 2 role:', error);
    return;
  }

  const updatedUser2 = await updateUser2Role.json();
  console.log('✅ Role updated for user 2');
  console.log(`   New role: ${updatedUser2.role}\n`);

  // Step 6: Verify both users can login with courier role
  console.log('6️⃣ Verifying courier accounts can login...');
  
  const courier1Login = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cura1@mail.com',
      password: 'cura123',
    }),
  });

  const courier1Data = await courier1Login.json();
  console.log('✅ cura1@mail.com login successful');
  console.log(`   Role: ${courier1Data.user.role}`);

  const courier2Login = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cura2@mail.com',
      password: 'cura123',
    }),
  });

  const courier2Data = await courier2Login.json();
  console.log('✅ cura2@mail.com login successful');
  console.log(`   Role: ${courier2Data.user.role}\n`);

  console.log('🎉 Success! Created 2 courier users:\n');
  console.log('📦 Courier 1:');
  console.log(`   Email: cura1@mail.com`);
  console.log(`   Password: cura123`);
  console.log(`   Role: ${courier1Data.user.role}`);
  console.log(`   ID: ${courier1Data.user.id}\n`);
  
  console.log('📦 Courier 2:');
  console.log(`   Email: cura2@mail.com`);
  console.log(`   Password: cura123`);
  console.log(`   Role: ${courier2Data.user.role}`);
  console.log(`   ID: ${courier2Data.user.id}\n`);
}

createUsersAndAssignRoles().catch(console.error);
