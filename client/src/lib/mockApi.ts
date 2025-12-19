import { currentFamily, familyMembers, currentUser, type Family, type User } from "./mockData";

// Mock user database - persists in memory for the session
let registeredUsers: any[] = [];

export async function fetchMockApi(endpoint: string, options: RequestInit = {}) {
  // Mock API for development
  const url = endpoint;

  // Handle family members endpoint
  if (url.includes("/families/") && url.includes("/members")) {
    const familyId = url.split("/")[2];
    if (familyId === "f1") {
      // Return all family members with their proper roles
      // In a real app, this would come from the database
      return {
        family: currentFamily,
        members: familyMembers.map(member => ({
          id: member.id,
          username: member.username,
          firstName: member.firstName || "",
          lastName: member.lastName || "",
          role: member.role || "member",
        }))
      };
    }
  }

  // Handle family invitations endpoint
  if (url.includes("/families/") && url.includes("/invitations")) {
    const familyId = url.split("/")[2];
    if (familyId === "f1") {
      if (options.method === "POST") {
        // Mock invitation creation using username instead of email
        const { username, invitedBy } = JSON.parse(options.body as string);
        return {
          id: "inv1",
          familyId: "f1",
          email: username + "@familyfinance.local", // Generate email from username
          invitedBy: invitedBy,
          invitationCode: "ABC123",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        // Mock getting invitations
        return [];
      }
    }
  }

  // Handle generate invitation endpoint
  if (url.includes("/families/") && url.includes("/generate-invitation")) {
    const familyId = url.split("/")[2];
    if (familyId === "f1") {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        invitationCode: code
      };
    }
  }

  // Handle create family endpoint
  if (url === "/families/create") {
    const { userId, familyName } = JSON.parse(options.body as string);

    // Create new family
    const newFamily: Family = {
      id: "f1",
      name: familyName,
      members: []
    };

    // Add current user as admin - use the actual current user data
    const userToAdd = {
      id: userId,
      username: currentUser.username || "new_user",
      avatar: currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=new_user",
      firstName: currentUser.firstName || "New",
      lastName: currentUser.lastName || "User",
      role: "admin" as const
    };

    newFamily.members.push(userToAdd);

    // Update global state (in a real app, this would be a database)
    currentFamily.name = familyName;
    currentFamily.members = newFamily.members;
    // Don't push to familyMembers if it's the current user to avoid duplicates
    if (!familyMembers.some(m => m.id === userToAdd.id)) {
      familyMembers.push(userToAdd);
    }

    return {
      family: newFamily,
      user: {
        id: userToAdd.id,
        username: userToAdd.username,
        firstName: userToAdd.firstName,
        lastName: userToAdd.lastName,
        familyId: newFamily.id,
        role: "admin",
      }
    };
  }

  // Handle join family endpoint
  if (url === "/families/join") {
    const { userId, invitationCode } = JSON.parse(options.body as string);
    // In a real app, we would validate the code against stored invitations
    // For mock purposes, we'll accept any code

    // Find the user in registered users first, then in family members
    let userToAdd = registeredUsers.find(u => u.id === userId);

    if (!userToAdd) {
      // Fallback to family members if not in registered users
      userToAdd = familyMembers.find(u => u.id === userId);
    }

    if (!userToAdd) {
      throw new Error("User not found");
    }

    // Ensure user has family membership
    const familyUser = {
      ...userToAdd,
      familyId: "f1",
      role: (userToAdd.role === "admin" ? "admin" : "member") as "admin" | "member"
    };

    // Add user to family members list if not already there
    if (!familyMembers.some(m => m.id === familyUser.id)) {
      familyMembers.push(familyUser);
    }

    // Add user to current family members if not already there
    if (!currentFamily.members.some(m => m.id === familyUser.id)) {
      currentFamily.members.push(familyUser);
    }

    return {
      user: {
        id: familyUser.id,
        username: familyUser.username,
        firstName: familyUser.firstName,
        lastName: familyUser.lastName,
        familyId: familyUser.familyId,
        role: familyUser.role,
      },
      family: currentFamily
    };
  }

  // Handle leave family endpoint
  if (url === "/families/leave") {
    const { userId } = JSON.parse(options.body as string);

    // Remove user from family
    currentFamily.members = currentFamily.members.filter(m => m.id !== userId);
    familyMembers.splice(familyMembers.findIndex(m => m.id === userId), 1);

    return {
      success: true,
      message: "User left family successfully"
    };
  }

  // Handle update member role endpoint
  if (url.includes("/families/") && url.includes("/members/") && options.method === "PUT") {
    const familyId = url.split("/")[2];
    const memberId = url.split("/")[4];
    const { role } = JSON.parse(options.body as string);

    if (familyId === "f1") {
      // Update role in family members
      const memberIndex = familyMembers.findIndex(m => m.id === memberId);
      if (memberIndex !== -1) {
        familyMembers[memberIndex] = { ...familyMembers[memberIndex], role };

        // Update in current family as well
        const familyMemberIndex = currentFamily.members.findIndex(m => m.id === memberId);
        if (familyMemberIndex !== -1) {
          currentFamily.members[familyMemberIndex] = { ...currentFamily.members[familyMemberIndex], role };
        }

        return {
          success: true,
          message: "Member role updated successfully"
        };
      }
    }

    throw new Error("Member not found");
  }

  // Handle account deletion endpoint
  if (url === "/account/delete") {
    const { userId } = JSON.parse(options.body as string);

    // Remove user from family
    currentFamily.members = currentFamily.members.filter(m => m.id !== userId);

    // Remove user from family members list
    const index = familyMembers.findIndex(m => m.id === userId);
    if (index > -1) {
      familyMembers.splice(index, 1);
    }

    // Remove user from registered users
    const userIndex = registeredUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      registeredUsers.splice(userIndex, 1);
    }

    return {
      success: true,
      message: "Account deleted successfully"
    };
  }

  // Handle login endpoint
  if (url === "/login") {
    const { username, password } = JSON.parse(options.body as string);

    // Check if user exists in registered users and password matches
    const user = registeredUsers.find(u => u.username === username && u.password === password);

    if (user) {
      return {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          familyId: user.familyId,
          role: user.role,
        },
        family: user.familyId ? currentFamily : null
      };
    } else {
      // Return error for invalid credentials
      throw new Error("Invalid username or password");
    }
  }

  // Handle register endpoint
  if (url === "/register") {
    const data = JSON.parse(options.body as string);

    // Check if username already exists
    const existingUser = registeredUsers.find(u => u.username === data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Create new user
    const newUser = {
      id: "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.username,
      familyId: data.invitationCode ? "f1" : (data.familyName ? "f1" : null),
      role: data.invitationCode ? "member" as const : (data.familyName ? "admin" as const : "member" as const),
    };

    // Add to registered users
    registeredUsers.push(newUser);

    let familyResponse = null;

    // If invitation code provided, join existing family
    if (data.invitationCode) {
      // Add user to existing family
      const familyUser = {
        ...newUser,
        familyId: "f1",
        role: "member" as const
      };

      // Add to family members
      if (!familyMembers.some(m => m.id === familyUser.id)) {
        familyMembers.push(familyUser);
      }

      // Add to current family
      if (!currentFamily.members.some(m => m.id === familyUser.id)) {
        currentFamily.members.push(familyUser);
      }

      familyResponse = currentFamily;
    }
    // If creating family, update family state
    else if (data.familyName) {
      // Create new family
      const newFamily = {
        id: "f1",
        name: data.familyName,
        members: [newUser]
      };

      // Update global state
      currentFamily.name = data.familyName;
      currentFamily.members = newFamily.members;

      // Add user to family members
      if (!familyMembers.some(m => m.id === newUser.id)) {
        familyMembers.push(newUser);
      }

      familyResponse = newFamily;
    }

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        familyId: newUser.familyId,
        role: newUser.role,
      },
      family: familyResponse
    };
  }

  // For other endpoints, return empty response
  return {};
}
