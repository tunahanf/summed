// Define the user profile type
interface UserProfile {
  age: number;
  height: number;
  weight: number;
  lastUpdated: string;
}

// Simple in-memory store for user profile
class UserProfileStoreClass {
  private userProfile: UserProfile | null = null;

  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  saveUserProfile(profile: UserProfile): void {
    this.userProfile = profile;
    console.log('Profile saved:', profile);
  }

  hasUserProfile(): boolean {
    return this.userProfile !== null;
  }

  clearUserProfile(): void {
    this.userProfile = null;
  }
}

// Export a singleton instance
export const UserProfileStore = new UserProfileStoreClass(); 