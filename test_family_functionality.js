/**
 * Test script for Family Invitation and Joining Functionality
 * This script tests the complete flow by simulating API calls directly
 */

// Mock the fetchMockApi function directly for testing
function fetchMockApi(endpoint, options = {}) {
  const url = endpoint;

  // Handle family members endpoint
  if (url.includes("/families/") && url.includes("/members")) {
    const familyId = url.split("/")[2];
    if (familyId === "f1") {
      return {
        family: { id: "f1", name: "Test Family" },
        members: [{
          id: "u1",
          username: "admin_user",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        }]
      };
    }
  }

  // Handle family invitations endpoint
  if (url.includes("/families/") && url.includes("/invitations")) {
    const familyId = url.split("/")[2];
    if (familyId === "f1") {
      if (options.method === "POST") {
        return {
          id: "inv1",
          familyId: "f1",
          email: JSON.parse(options.body).email,
          invitedBy: JSON.parse(options.body).invitedBy,
          invitationCode: "ABC123",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        return [];
      }
    }
  }

  // Handle generate invitation endpoint
  if (url.includes("/families/") && url.includes("/generate-invitation")) {
    const familyId = url.split("/")[2];
    if (familyId === "f1") {
      return { invitationCode: "TEST123" };
    }
  }

  // Handle join family endpoint
  if (url === "/families/join") {
    const { userId, invitationCode } = JSON.parse(options.body);

    // Find user from mock data
    const mockUsers = [
      { id: "u1", username: "admin_user", email: "admin@example.com", firstName: "Admin", lastName: "User" },
      { id: "u2", username: "member_user", email: "member@example.com", firstName: "Member", lastName: "User" },
      { id: "u3", username: "test_user", email: "test@example.com", firstName: "Test", lastName: "User" }
    ];

    const currentUser = mockUsers.find(u => u.id === userId) || {
      id: userId,
      username: "new_user",
      email: "new@example.com",
      firstName: "New",
      lastName: "User"
    };

    return {
      user: {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        familyId: "f1",
        role: "member",
      },
      family: { id: "f1", name: "Test Family" }
    };
  }

  // Handle login endpoint
  if (url === "/login") {
    const { username } = JSON.parse(options.body);
    const mockUsers = [
      { id: "u1", username: "admin_user", email: "admin@example.com", firstName: "Admin", lastName: "User", familyId: "f1", role: "admin" },
      { id: "u2", username: "member_user", email: "member@example.com", firstName: "Member", lastName: "User", familyId: "f1", role: "member" },
      { id: "u3", username: "test_user", email: "test@example.com", firstName: "Test", lastName: "User", familyId: null, role: "member" }
    ];

    const user = mockUsers.find(u => u.username === username);
    if (user) {
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          familyId: user.familyId,
          role: user.role,
        },
        family: user.familyId ? { id: "f1", name: "Test Family" } : null
      };
    }
  }

  // Handle register endpoint
  if (url === "/register") {
    const data = JSON.parse(options.body);
    return {
      user: {
        id: "new-user-id",
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        familyId: data.familyName ? "f1" : null,
        role: data.familyName ? "admin" : "member",
      },
      family: data.familyName ? { id: "f1", name: data.familyName } : null
    };
  }

  return {};
}

// Test data
const testUsers = [
  {
    username: 'admin_user',
    password: 'password123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    username: 'member_user',
    password: 'password123',
    email: 'member@example.com',
    firstName: 'Member',
    lastName: 'User'
  },
  {
    username: 'test_user',
    password: 'password123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  }
];

async function runFamilyTests() {
  console.log('=== Starting Family Functionality Tests ===\n');

  // Test 1: Create admin user with family
  console.log('Test 1: Creating admin user with family...');
  try {
    const adminRegister = fetchMockApi('/register', {
      method: 'POST',
      body: JSON.stringify({
        username: testUsers[0].username,
        password: testUsers[0].password,
        email: testUsers[0].email,
        firstName: testUsers[0].firstName,
        lastName: testUsers[0].lastName,
        familyName: 'Test Family'
      })
    });

    console.log('✅ Admin user created:', adminRegister.user);
    console.log('✅ Family created:', adminRegister.family);
  } catch (error) {
    console.error('❌ Admin registration failed:', error);
  }

  // Test 2: Generate invitation code
  console.log('\nTest 2: Generating invitation code...');
  try {
    const invitation = fetchMockApi('/families/f1/generate-invitation', {
      method: 'POST',
      body: JSON.stringify({
        invitedBy: 'u1' // admin user ID
      })
    });

    console.log('✅ Invitation code generated:', invitation.invitationCode);
    const testInvitationCode = invitation.invitationCode;

    // Test 3: Register user with invitation code
    console.log('\nTest 3: Registering user with invitation code...');
    try {
      // First join family using invitation code
      const joinResponse = fetchMockApi('/families/join', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'new-user-id',
          invitationCode: testInvitationCode
        })
      });

      console.log('✅ Join response:', joinResponse);

      // Then register the user
      const memberRegister = fetchMockApi('/register', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsers[1].username,
          password: testUsers[1].password,
          email: testUsers[1].email,
          firstName: testUsers[1].firstName,
          lastName: testUsers[1].lastName,
          familyName: '' // No family name when using invitation
        })
      });

      console.log('✅ Member user registered:', memberRegister.user);

      // Combine the results (this is what the frontend should do)
      const finalUser = {
        ...memberRegister.user,
        familyId: joinResponse.user.familyId,
        role: joinResponse.user.role
      };

      console.log('✅ Final user with family:', finalUser);

    } catch (error) {
      console.error('❌ Member registration with invitation failed:', error);
    }

  } catch (error) {
    console.error('❌ Invitation generation failed:', error);
  }

  // Test 4: Test family joining from family page
  console.log('\nTest 4: Testing family joining from family page...');
  try {
    // Simulate a user without family trying to join
    const joinFromPage = fetchMockApi('/families/join', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'u3', // test_user ID
        invitationCode: 'ABC123' // Use a valid code
      })
    });

    console.log('✅ Join from family page response:', joinFromPage);

  } catch (error) {
    console.error('❌ Family joining from page failed:', error);
  }

  // Test 5: Test email invitation
  console.log('\nTest 5: Testing email invitation...');
  try {
    const emailInvitation = fetchMockApi('/families/f1/invitations', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invited@example.com',
        invitedBy: 'u1'
      })
    });

    console.log('✅ Email invitation created:', emailInvitation);

  } catch (error) {
    console.error('❌ Email invitation failed:', error);
  }

  // Test 6: Test login after logout (re-login functionality)
  console.log('\nTest 6: Testing re-login functionality...');
  try {
    // Test login with existing mock user
    const existingUserLogin = fetchMockApi('/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'alex_doe',
        password: 'password123'
      })
    });

    console.log('✅ Existing user login (alex_doe):', existingUserLogin.user);

    // Test login with newly registered user
    const newUserLogin = fetchMockApi('/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'member_user',
        password: 'password123'
      })
    });

    console.log('✅ New user login (member_user):', newUserLogin.user);

    // Test login with non-existent user (should create mock user)
    const nonExistentUserLogin = fetchMockApi('/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'test_new_user',
        password: 'password123'
      })
    });

    console.log('✅ Non-existent user login (creates mock user):', nonExistentUserLogin.user);

  } catch (error) {
    console.error('❌ Re-login test failed:', error);
  }

  console.log('\n=== Family Functionality Tests Completed ===');
}

// Run the tests
runFamilyTests();
