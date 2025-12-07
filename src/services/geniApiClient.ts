import type { GeniConfig, GeniProfile, GeniUnion, GeniImmediateFamily, GeniAuthResponse, GeniError } from '@/types/geni';

/**
 * Client for interacting with Geni.com API
 * Handles OAuth authentication and API requests
 */
export class GeniApiClient {
  private baseUrl = 'https://www.geni.com/api';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private config: GeniConfig;

  constructor(config: GeniConfig) {
    this.config = config;
    // Try to restore token from localStorage
    this.restoreToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    // Check if token is expired (with 5 min buffer)
    return this.tokenExpiry.getTime() > Date.now() + 5 * 60 * 1000;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.isAuthenticated() ? this.accessToken : null;
  }

  /**
   * Initiate OAuth authentication flow
   */
  authenticate(): void {
    const authUrl = new URL('https://www.geni.com/platform/oauth/authorize');
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    
    // Redirect to Geni OAuth page
    window.location.href = authUrl.toString();
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  async handleOAuthCallback(code: string): Promise<void> {
    try {
      // Note: In production, this should go through a backend proxy
      // to keep client_secret secure. For now, using implicit flow.
      const tokenUrl = new URL('https://www.geni.com/platform/oauth/request_token');
      tokenUrl.searchParams.set('client_id', this.config.clientId);
      tokenUrl.searchParams.set('redirect_uri', this.config.redirectUri);
      tokenUrl.searchParams.set('code', code);
      tokenUrl.searchParams.set('grant_type', 'authorization_code');

      const response = await fetch(tokenUrl.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`OAuth token exchange failed: ${response.statusText}`);
      }

      const data: GeniAuthResponse = await response.json();
      this.setToken(data.access_token, data.expires_in);
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Set access token and store it
   */
  private setToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    
    // Store in localStorage
    localStorage.setItem('geni_access_token', token);
    localStorage.setItem('geni_token_expiry', this.tokenExpiry.toISOString());
  }

  /**
   * Restore token from localStorage
   */
  private restoreToken(): void {
    const token = localStorage.getItem('geni_access_token');
    const expiry = localStorage.getItem('geni_token_expiry');
    
    if (token && expiry) {
      this.accessToken = token;
      this.tokenExpiry = new Date(expiry);
      
      // Clear if expired
      if (!this.isAuthenticated()) {
        this.clearToken();
      }
    }
  }

  /**
   * Clear stored token
   */
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('geni_access_token');
    localStorage.removeItem('geni_token_expiry');
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please log in to Geni.');
    }

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        this.clearToken();
        throw new Error('Authentication expired. Please log in again.');
      }
      
      const errorData: GeniError = await response.json().catch(() => ({
        error: 'Unknown error',
        status: response.status,
      }));
      
      throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get profile by ID
   */
  async getProfile(profileId: string): Promise<GeniProfile> {
    return await this.request<GeniProfile>(`/profile-${profileId}`);
  }

  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<GeniProfile> {
    return await this.request<GeniProfile>('/profile');
  }

  /**
   * Get immediate family (parents, spouses, children, siblings)
   */
  async getImmediateFamily(profileId: string): Promise<GeniImmediateFamily> {
    return await this.request<GeniImmediateFamily>(`/profile-${profileId}/immediate-family`);
  }

  /**
   * Get union (marriage/partnership) details
   */
  async getUnion(unionId: string): Promise<GeniUnion> {
    return await this.request<GeniUnion>(`/union-${unionId}`);
  }

  /**
   * Get multiple profiles in batch
   */
  async getProfiles(profileIds: string[]): Promise<Map<string, GeniProfile>> {
    const profiles = new Map<string, GeniProfile>();
    
    // Geni API doesn't have batch endpoint, so fetch individually
    // In production, consider rate limiting here
    for (const id of profileIds) {
      try {
        const profile = await this.getProfile(id);
        profiles.set(id, profile);
      } catch (error) {
        console.warn(`Failed to fetch profile ${id}:`, error);
        // Continue with other profiles
      }
    }
    
    return profiles;
  }

  /**
   * Load family tree starting from a profile
   * Recursively loads relatives up to specified generations
   */
  async loadFamilyTree(
    startProfileId: string,
    options: {
      includeAncestors?: boolean;
      includeDescendants?: boolean;
      generations?: number;
    } = {}
  ): Promise<{ profiles: GeniProfile[]; unions: GeniUnion[] }> {
    const {
      includeAncestors = true,
      includeDescendants = true,
      generations = 3,
    } = options;

    const loadedProfiles = new Map<string, GeniProfile>();
    const loadedUnions = new Map<string, GeniUnion>();
    const queue: Array<{ id: string; generation: number; direction: 'up' | 'down' }> = [];

    // Start with the focus profile
    const startProfile = await this.getProfile(startProfileId);
    loadedProfiles.set(startProfile.id, startProfile);

    // Get immediate family to seed the queue
    const immediateFamily = await this.getImmediateFamily(startProfileId);

    // Process immediate family
    if (immediateFamily.parents && includeAncestors) {
      for (const parent of immediateFamily.parents) {
        if (!loadedProfiles.has(parent.id)) {
          loadedProfiles.set(parent.id, parent);
          if (generations > 1) {
            queue.push({ id: parent.id, generation: 1, direction: 'up' });
          }
        }
      }
    }

    if (immediateFamily.children && includeDescendants) {
      for (const child of immediateFamily.children) {
        if (!loadedProfiles.has(child.id)) {
          loadedProfiles.set(child.id, child);
          if (generations > 1) {
            queue.push({ id: child.id, generation: 1, direction: 'down' });
          }
        }
      }
    }

    if (immediateFamily.spouses) {
      for (const spouse of immediateFamily.spouses) {
        if (!loadedProfiles.has(spouse.id)) {
          loadedProfiles.set(spouse.id, spouse);
        }
      }
    }

    if (immediateFamily.siblings) {
      for (const sibling of immediateFamily.siblings) {
        if (!loadedProfiles.has(sibling.id)) {
          loadedProfiles.set(sibling.id, sibling);
        }
      }
    }

    // Load unions
    if (immediateFamily.unions) {
      for (const union of immediateFamily.unions) {
        loadedUnions.set(union.id, union);
      }
    }

    // Process queue for additional generations
    while (queue.length > 0) {
      const { id, generation, direction } = queue.shift()!;
      
      if (generation >= generations) continue;

      try {
        const family = await this.getImmediateFamily(id);

        // Load ancestors
        if (direction === 'up' && family.parents && includeAncestors) {
          for (const parent of family.parents) {
            if (!loadedProfiles.has(parent.id)) {
              loadedProfiles.set(parent.id, parent);
              queue.push({ id: parent.id, generation: generation + 1, direction: 'up' });
            }
          }
        }

        // Load descendants
        if (direction === 'down' && family.children && includeDescendants) {
          for (const child of family.children) {
            if (!loadedProfiles.has(child.id)) {
              loadedProfiles.set(child.id, child);
              queue.push({ id: child.id, generation: generation + 1, direction: 'down' });
            }
          }
        }

        // Always load spouses
        if (family.spouses) {
          for (const spouse of family.spouses) {
            if (!loadedProfiles.has(spouse.id)) {
              loadedProfiles.set(spouse.id, spouse);
            }
          }
        }

        // Load unions
        if (family.unions) {
          for (const union of family.unions) {
            if (!loadedUnions.has(union.id)) {
              loadedUnions.set(union.id, union);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to load family for profile ${id}:`, error);
        // Continue with other profiles
      }
    }

    return {
      profiles: Array.from(loadedProfiles.values()),
      unions: Array.from(loadedUnions.values()),
    };
  }
}
