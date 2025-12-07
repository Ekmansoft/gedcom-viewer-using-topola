# Geni API Integration - Technical Proposal

## Overview

Integrate the Geni.com API as an alternative data source alongside GEDCOM file uploads, allowing users to visualize their family tree data directly from Geni.com.

## Terminology

**Note:** The codebase uses `FamilyData` as the internal data format (not `GedcomData`). This reflects the source-agnostic nature of the architecture - the data structure can be populated from GEDCOM files, Geni API, or any other genealogy data source. The GEDCOM parser specifically handles GEDCOM files, while `FamilyData` is the universal internal representation.

## Current Architecture

```
┌─────────────┐
│ FileUpload  │──┐
└─────────────┘  │
                 ├──► GedcomParser ──► FamilyData ──► Store ──► Charts
                 │
┌─────────────┐  │
│   Header    │──┘
└─────────────┘
```

## Proposed Architecture

```
┌─────────────────┐
│   DataSource    │
│   Selector      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐  ┌─▼──────────┐
│ GEDCOM │  │ Geni API   │
│ Upload │  │ Connect    │
└───┬────┘  └─┬──────────┘
    │         │
    │    ┌────▼──────────┐
    │    │ GeniApiClient │
    │    │  (OAuth 2.0)  │
    │    └────┬──────────┘
    │         │
┌───▼─────────▼───────┐
│  GedcomParser /     │
│  GeniDataAdapter    │
└──────────┬──────────┘
           │
      FamilyData
           │
      ┌────▼────┐
      │  Store  │
      └────┬────┘
           │
      ┌────▼────┐
      │ Charts  │
      └─────────┘
```

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 Geni API Client Service

**File:** `src/services/geniApiClient.ts`

```typescript
interface GeniConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}

interface GeniProfile {
  id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maiden_name?: string;
  suffix?: string;
  gender?: string;
  birth?: { date?: GeniDate; location?: GeniLocation };
  death?: { date?: GeniDate; location?: GeniLocation };
  photo_urls?: { url: string }[];
  unions?: string[]; // union IDs
}

interface GeniUnion {
  id: string;
  partners: string[]; // profile IDs
  children: string[]; // profile IDs
  status?: string;
}

class GeniApiClient {
  private accessToken: string | null = null;
  private baseUrl = 'https://www.geni.com/api';

  // OAuth flow
  async authenticate(): Promise<void>
  async handleOAuthCallback(code: string): Promise<void>
  async refreshToken(): Promise<void>
  
  // API calls
  async getProfile(profileId: string): Promise<GeniProfile>
  async getImmediateFamily(profileId: string): Promise<{
    profile: GeniProfile;
    parents: GeniProfile[];
    siblings: GeniProfile[];
    spouses: GeniProfile[];
    children: GeniProfile[];
  }>
  
  async getUnion(unionId: string): Promise<GeniUnion>
  async getAncestors(profileId: string, generations: number): Promise<GeniProfile[]>
  async getDescendants(profileId: string, generations: number): Promise<GeniProfile[]>
  
  // Batch operations
  async getProfiles(profileIds: string[]): Promise<Map<string, GeniProfile>>
}
```

**Key Features:**
- OAuth 2.0 authentication flow
- Token storage in localStorage
- Automatic token refresh
- Rate limiting handling (429 responses)
- Batch requests to minimize API calls
- Error handling with user-friendly messages

#### 1.2 Geni Data Adapter

**File:** `src/services/geniDataAdapter.ts`

```typescript
class GeniDataAdapter {
  /**
   * Convert Geni profile data to FamilyData format
   */
  convertToFamilyData(
    profiles: GeniProfile[],
    unions: GeniUnion[]
  ): FamilyData {
    return {
      indis: profiles.map(p => this.convertProfile(p)),
      fams: unions.map(u => this.convertUnion(u))
    };
  }

  private convertProfile(geniProfile: GeniProfile): Profile {
    return {
      id: `@${geniProfile.id}@`,
      firstName: geniProfile.first_name,
      lastName: geniProfile.last_name || geniProfile.maiden_name,
      sex: this.convertGender(geniProfile.gender),
      birth: this.convertEvent(geniProfile.birth),
      death: this.convertEvent(geniProfile.death),
      images: geniProfile.photo_urls?.map(p => ({ url: p.url })),
      fams: geniProfile.unions?.map(u => `@${u}@`),
      // ... additional mappings
    };
  }

  private convertUnion(geniUnion: GeniUnion): Family {
    return {
      id: `@${geniUnion.id}@`,
      husb: geniUnion.partners[0] ? `@${geniUnion.partners[0]}@` : undefined,
      wife: geniUnion.partners[1] ? `@${geniUnion.partners[1]}@` : undefined,
      children: geniUnion.children.map(c => `@${c}@`),
      // ... additional mappings
    };
  }

  private convertGender(gender?: string): 'M' | 'F' | 'U' | 'X' | undefined {
    if (!gender) return undefined;
    const g = gender.toLowerCase();
    if (g === 'male') return 'M';
    if (g === 'female') return 'F';
    return 'U';
  }

  private convertEvent(event?: any): any {
    if (!event) return undefined;
    return {
      date: this.parseDate(event.date),
      place: event.location?.formatted_location,
      confirmed: true
    };
  }

  private parseDate(geniDate?: any): any {
    if (!geniDate) return undefined;
    // Parse Geni date format to GEDCOM date format
    // Geni uses: { year, month, day, circa, before, after }
    return {
      year: geniDate.year,
      month: geniDate.month,
      day: geniDate.day,
      text: geniDate.formatted_date
    };
  }
}
```

#### 1.3 Data Source Types

**File:** `src/types/dataSource.ts`

```typescript
export type DataSourceType = 'gedcom' | 'geni';

export interface DataSource {
  type: DataSourceType;
  name: string;
  timestamp: Date;
  metadata?: {
    // For GEDCOM
    fileName?: string;
    fileSize?: number;
    
    // For Geni
    geniProfileId?: string;
    geniProfileName?: string;
    generationsLoaded?: number;
  };
}

export interface GeniConnectionState {
  isConnected: boolean;
  accessToken: string | null;
  expiresAt: Date | null;
  currentProfileId: string | null;
  currentProfileName: string | null;
}
```

### Phase 2: User Interface

#### 2.1 Data Source Selector

**File:** `src/components/dataSource/DataSourceSelector.tsx`

```typescript
function DataSourceSelector() {
  const [selectedSource, setSelectedSource] = useState<DataSourceType>('gedcom');

  return (
    <div className="data-source-selector">
      <div className="flex gap-4 mb-4">
        <button
          className={`source-tab ${selectedSource === 'gedcom' ? 'active' : ''}`}
          onClick={() => setSelectedSource('gedcom')}
        >
          <FileText className="w-5 h-5" />
          <span>GEDCOM File</span>
        </button>
        
        <button
          className={`source-tab ${selectedSource === 'geni' ? 'active' : ''}`}
          onClick={() => setSelectedSource('geni')}
        >
          <Globe className="w-5 h-5" />
          <span>Geni.com</span>
        </button>
      </div>

      {selectedSource === 'gedcom' && <FileUpload />}
      {selectedSource === 'geni' && <GeniConnect />}
    </div>
  );
}
```

#### 2.2 Geni Connection Component

**File:** `src/components/geni/GeniConnect.tsx`

```typescript
function GeniConnect() {
  const [connectionState, setConnectionState] = useState<GeniConnectionState>({
    isConnected: false,
    accessToken: null,
    expiresAt: null,
    currentProfileId: null,
    currentProfileName: null
  });
  const [loadingOptions, setLoadingOptions] = useState({
    generations: 3,
    includeAncestors: true,
    includeDescendants: true,
    includeSiblings: true
  });

  const handleConnect = async () => {
    const client = new GeniApiClient(config);
    await client.authenticate();
    // OAuth redirect flow...
  };

  const handleLoadData = async () => {
    const client = new GeniApiClient(config);
    
    // Show loading state
    setLoading(true);
    
    try {
      // Fetch user's profile first
      const profile = await client.getProfile('me');
      
      // Fetch family data based on options
      const profiles: GeniProfile[] = [];
      const unions: GeniUnion[] = [];
      
      if (loadingOptions.includeAncestors) {
        const ancestors = await client.getAncestors(
          profile.id, 
          loadingOptions.generations
        );
        profiles.push(...ancestors);
      }
      
      if (loadingOptions.includeDescendants) {
        const descendants = await client.getDescendants(
          profile.id,
          loadingOptions.generations
        );
        profiles.push(...descendants);
      }
      
      // Fetch all unions for the profiles
      const unionIds = new Set(profiles.flatMap(p => p.unions || []));
      for (const unionId of unionIds) {
        const union = await client.getUnion(unionId);
        unions.push(union);
      }
      
      // Convert to FamilyData format
      const adapter = new GeniDataAdapter();
      const familyData = adapter.convertToFamilyData(profiles, unions);
      
      // Load into store
      loadFamilyTree(familyData, `Geni: ${profile.name}`);
      
      // Build relationship graph
      const builder = new RelationshipGraphBuilder();
      const graph = builder.build(gedcomData);
      setRelationshipGraph(graph);
      
    } catch (error) {
      console.error('Error loading Geni data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="geni-connect">
      {!connectionState.isConnected ? (
        <div className="connect-prompt">
          <Globe className="w-16 h-16 text-blue-500 mb-4" />
          <h3>Connect to Geni.com</h3>
          <p>Access your family tree data from Geni.com</p>
          
          <button onClick={handleConnect} className="btn-primary">
            <LogIn className="w-4 h-4 mr-2" />
            Connect with Geni
          </button>
          
          <div className="info-box mt-4">
            <Info className="w-4 h-4" />
            <p>You'll be redirected to Geni.com to authorize access</p>
          </div>
        </div>
      ) : (
        <div className="load-options">
          <div className="connection-info">
            <Check className="w-5 h-5 text-green-500" />
            <span>Connected as {connectionState.currentProfileName}</span>
            <button onClick={handleDisconnect} className="btn-link">
              Disconnect
            </button>
          </div>

          <div className="options-panel">
            <h4>Load Options</h4>
            
            <div className="option">
              <label>
                <input
                  type="checkbox"
                  checked={loadingOptions.includeAncestors}
                  onChange={(e) => setLoadingOptions(prev => ({
                    ...prev,
                    includeAncestors: e.target.checked
                  }))}
                />
                Include Ancestors
              </label>
            </div>
            
            <div className="option">
              <label>
                <input
                  type="checkbox"
                  checked={loadingOptions.includeDescendants}
                  onChange={(e) => setLoadingOptions(prev => ({
                    ...prev,
                    includeDescendants: e.target.checked
                  }))}
                />
                Include Descendants
              </label>
            </div>
            
            <div className="option">
              <label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={loadingOptions.generations}
                  onChange={(e) => setLoadingOptions(prev => ({
                    ...prev,
                    generations: parseInt(e.target.value)
                  }))}
                />
                Generations
              </label>
            </div>
          </div>

          <button 
            onClick={handleLoadData} 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load Family Tree
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 2.3 Update Welcome Screen

**File:** `src/components/layout/WelcomeScreen.tsx`

Replace `FileUpload` with `DataSourceSelector` to show both options.

### Phase 3: Store Integration

#### 3.1 Update Gedcom Store

**File:** `src/store/familyStore.ts`

Add data source tracking:

```typescript
interface FamilyStore {
  // ... existing fields
  dataSource: DataSource | null;
  
  // ... existing actions
  loadFamilyTree: (data: FamilyData, sourceName?: string, source?: DataSource) => void;
}

// In implementation:
loadFamilyTree: (data, sourceName, source) => {
  set((state) => {
    state.familyData = data;
    state.fileName = sourceName || null;
    state.dataSource = source || {
      type: 'gedcom',
      name: sourceName || 'Unknown',
      timestamp: new Date()
    };
    // ... rest of implementation
  });
}
```

#### 3.2 Create Geni Store (Optional)

**File:** `src/store/geniStore.ts`

Separate store for Geni-specific state:

```typescript
interface GeniStore {
  connectionState: GeniConnectionState;
  setConnectionState: (state: GeniConnectionState) => void;
  disconnect: () => void;
}

export const useGeniStore = create<GeniStore>()((set) => ({
  connectionState: {
    isConnected: false,
    accessToken: localStorage.getItem('geni_access_token'),
    expiresAt: null,
    currentProfileId: null,
    currentProfileName: null
  },
  
  setConnectionState: (state) => {
    set({ connectionState: state });
    if (state.accessToken) {
      localStorage.setItem('geni_access_token', state.accessToken);
    }
  },
  
  disconnect: () => {
    localStorage.removeItem('geni_access_token');
    set({
      connectionState: {
        isConnected: false,
        accessToken: null,
        expiresAt: null,
        currentProfileId: null,
        currentProfileName: null
      }
    });
  }
}));
```

### Phase 4: OAuth Configuration

#### 4.1 Environment Variables

**File:** `.env.local` (not committed)

```env
VITE_GENI_CLIENT_ID=your_client_id_here
VITE_GENI_REDIRECT_URI=http://localhost:5173/oauth/callback
```

**File:** `.env.example` (committed)

```env
# Geni API Configuration
VITE_GENI_CLIENT_ID=
VITE_GENI_REDIRECT_URI=http://localhost:5173/oauth/callback
```

#### 4.2 OAuth Callback Route

**File:** `src/components/oauth/GeniCallback.tsx`

```typescript
function GeniCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/?geni_error=' + error);
      return;
    }

    if (code) {
      const client = new GeniApiClient(config);
      client.handleOAuthCallback(code)
        .then(() => {
          navigate('/?geni_connected=true');
        })
        .catch((err) => {
          console.error('OAuth callback error:', err);
          navigate('/?geni_error=callback_failed');
        });
    }
  }, [searchParams, navigate]);

  return (
    <div className="oauth-callback">
      <Loader className="animate-spin" />
      <p>Connecting to Geni...</p>
    </div>
  );
}
```

Add route to `App.tsx`:

```typescript
<Routes>
  <Route path="/" element={<MainLayout />} />
  <Route path="/oauth/callback" element={<GeniCallback />} />
</Routes>
```

### Phase 5: Error Handling & Edge Cases

#### 5.1 Rate Limiting

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 100; // per hour
  private timeWindow = 3600000; // 1 hour in ms

  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside time window
    this.requests = this.requests.filter(
      time => now - time < this.timeWindow
    );
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 60000)} minutes.`
      );
    }
    
    this.requests.push(now);
  }
}
```

#### 5.2 Private Profiles

```typescript
async getProfile(profileId: string): Promise<GeniProfile> {
  try {
    const response = await fetch(
      `${this.baseUrl}/profile-${profileId}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }
    );
    
    if (response.status === 403) {
      // Private profile
      return this.createPrivateProfilePlaceholder(profileId);
    }
    
    return await response.json();
  } catch (error) {
    // Handle error
  }
}

private createPrivateProfilePlaceholder(profileId: string): GeniProfile {
  return {
    id: profileId,
    name: 'Private Profile',
    first_name: 'Private',
    last_name: 'Profile',
    // Minimal data
  };
}
```

#### 5.3 Progress Tracking

```typescript
interface LoadProgress {
  current: number;
  total: number;
  stage: 'profiles' | 'unions' | 'converting' | 'done';
  message: string;
}

// In GeniConnect component:
const [progress, setProgress] = useState<LoadProgress | null>(null);

// Update during loading:
setProgress({
  current: loadedProfiles.length,
  total: estimatedTotal,
  stage: 'profiles',
  message: `Loading profile ${loadedProfiles.length}/${estimatedTotal}...`
});
```

## Technical Challenges & Solutions

### Challenge 1: CORS Issues

**Problem:** Browser can't make direct API calls to Geni due to CORS.

**Solutions:**
1. **OAuth redirect flow** - Works for authentication
2. **For API calls:**
   - Use Geni's JSONP support (if available)
   - Create a simple proxy endpoint (Node.js/Netlify function)
   - Use browser extension (developer option)

**Recommended:** Proxy endpoint for production

```typescript
// Netlify function: netlify/functions/geni-proxy.ts
export const handler = async (event) => {
  const { path, token } = JSON.parse(event.body);
  
  const response = await fetch(`https://www.geni.com/api/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(await response.json())
  };
};
```

### Challenge 2: Large Trees

**Problem:** Loading entire tree could be thousands of profiles.

**Solution:** Progressive loading with options:

```typescript
interface LoadStrategy {
  maxProfiles: number;
  priorityOrder: 'closest-first' | 'generation-by-generation';
  stopConditions: {
    maxGenerations?: number;
    maxProfiles?: number;
    maxApiCalls?: number;
  };
}

async loadTreeProgressively(
  startProfileId: string,
  strategy: LoadStrategy
): Promise<GedcomData> {
  const loaded = new Set<string>();
  const queue: Array<{ id: string; generation: number }> = [
    { id: startProfileId, generation: 0 }
  ];
  
  while (queue.length > 0 && loaded.size < strategy.maxProfiles) {
    const { id, generation } = queue.shift()!;
    
    if (loaded.has(id)) continue;
    if (generation > strategy.stopConditions.maxGenerations!) break;
    
    const family = await this.client.getImmediateFamily(id);
    loaded.add(id);
    
    // Add relatives to queue
    [...family.parents, ...family.children].forEach(relative => {
      if (!loaded.has(relative.id)) {
        queue.push({ id: relative.id, generation: generation + 1 });
      }
    });
  }
  
  // Convert loaded profiles to GedcomData
  // ...
}
```

### Challenge 3: Token Expiration

**Solution:** Automatic refresh with retry logic:

```typescript
async makeAuthenticatedRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const makeRequest = async () => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`
      }
    });
  };
  
  let response = await makeRequest();
  
  if (response.status === 401) {
    // Token expired, try to refresh
    await this.refreshToken();
    response = await makeRequest();
  }
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}
```

## Testing Strategy

### Unit Tests

```typescript
// geniDataAdapter.test.ts
describe('GeniDataAdapter', () => {
  it('should convert Geni profile to GEDCOM format', () => {
    const adapter = new GeniDataAdapter();
    const geniProfile: GeniProfile = {
      id: 'profile-123',
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      gender: 'male',
      birth: {
        date: { year: 1980, month: 5, day: 15 },
        location: { formatted_location: 'New York, NY' }
      }
    };
    
    const gedcomProfile = adapter.convertProfile(geniProfile);
    
    expect(gedcomProfile.id).toBe('@profile-123@');
    expect(gedcomProfile.firstName).toBe('John');
    expect(gedcomProfile.lastName).toBe('Doe');
    expect(gedcomProfile.sex).toBe('M');
    expect(gedcomProfile.birth.date.year).toBe(1980);
  });
});
```

### Integration Tests

```typescript
// geniApiClient.test.ts (with mocks)
describe('GeniApiClient', () => {
  it('should fetch profile data', async () => {
    const client = new GeniApiClient(mockConfig);
    const profile = await client.getProfile('profile-123');
    
    expect(profile.id).toBe('profile-123');
    expect(profile.name).toBeTruthy();
  });
  
  it('should handle rate limiting', async () => {
    // Test rate limiter behavior
  });
});
```

## Dependencies

New packages needed:

```json
{
  "dependencies": {
    // None - use native fetch
  },
  "devDependencies": {
    // Already have all needed for testing
  }
}
```

## Timeline Estimate

- **Phase 1** (Core Infrastructure): 2-3 days
- **Phase 2** (UI Components): 2 days
- **Phase 3** (Store Integration): 1 day
- **Phase 4** (OAuth Setup): 1 day
- **Phase 5** (Error Handling): 1 day
- **Testing & Polish**: 1-2 days

**Total**: ~8-10 days of development

## Deployment Considerations

### OAuth App Registration

1. Register app at Geni Developer Portal
2. Get Client ID and Client Secret
3. Configure redirect URIs

### Environment Setup

**Development:**
```
VITE_GENI_CLIENT_ID=dev_client_id
VITE_GENI_REDIRECT_URI=http://localhost:5173/oauth/callback
```

**Production:**
```
VITE_GENI_CLIENT_ID=prod_client_id
VITE_GENI_REDIRECT_URI=https://your-domain.com/oauth/callback
```

### Proxy Deployment

If CORS issues arise, deploy proxy to:
- Netlify Functions
- Vercel Serverless Functions
- AWS Lambda
- Or simple Express backend

## Security Considerations

1. **Token Storage**: Use httpOnly cookies in production (requires backend)
2. **Token Encryption**: Encrypt tokens in localStorage
3. **PKCE Flow**: Use PKCE for OAuth (more secure for SPAs)
4. **API Key Protection**: Never commit client secret to repo
5. **Rate Limiting**: Respect Geni's rate limits
6. **User Data**: Clear Geni data when user disconnects

## Future Enhancements

1. **Caching**: Cache Geni data in IndexedDB for offline access
2. **Sync**: Detect changes in Geni and offer refresh
3. **Export**: Allow exporting Geni data as GEDCOM file
4. **Photos**: Display photos from Geni profiles
5. **Documents**: Link to documents stored in Geni
6. **Collaboration**: Show collaborator information
7. **Real-time**: WebSocket connection for live updates

## Migration Path

### Backward Compatibility

All existing GEDCOM functionality remains unchanged. New features are additive:

```typescript
// Old code continues to work:
loadFamilyTree(familyData, 'my-file.ged');

// New code for Geni:
loadFamilyTree(familyData, 'Geni: John Doe', {
  type: 'geni',
  name: 'John Doe',
  timestamp: new Date(),
  metadata: { geniProfileId: 'profile-123' }
});
```

## Success Metrics

- ✅ User can connect to Geni account
- ✅ User can load their family tree from Geni
- ✅ Charts display correctly with Geni data
- ✅ Navigation works identically to GEDCOM mode
- ✅ Performance: Load time < 10s for 100 profiles
- ✅ Error handling: Clear messages for all failure cases

## Conclusion

The Geni API integration is architecturally sound and fits well with your existing codebase. The modular design allows for:

1. **Zero impact** on existing GEDCOM functionality
2. **Easy maintenance** - Geni code is isolated
3. **Future expansion** - Other APIs (FamilySearch, Ancestry) can follow same pattern
4. **User choice** - Users can use GEDCOM, Geni, or both
5. **Source-agnostic data model** - FamilyData format works with any genealogy source

The main technical challenge is CORS, which can be solved with a simple proxy. OAuth adds complexity but is well-documented and the flow is standard.

**Recommendation**: Proceed with implementation in phases, starting with Phase 1 to validate the API integration before building the full UI.
