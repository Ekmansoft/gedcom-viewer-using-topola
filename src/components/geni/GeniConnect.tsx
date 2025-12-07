import { useState, useEffect } from 'react';
import { Globe, LogIn, LogOut, Download, Loader, Check, Info, AlertCircle } from 'lucide-react';
import { GeniApiClient } from '@/services/geniApiClient';
import { GeniDataAdapter } from '@/services/geniDataAdapter';
import { RelationshipGraphBuilder } from '@/services/relationshipGraphBuilder';
import { useFamilyStore } from '@/store/familyStore';
import type { GeniConnectionState, LoadOptions } from '@/types/dataSource';
import type { GeniConfig } from '@/types/geni';

// Get config from environment variables
const getGeniConfig = (): GeniConfig | null => {
  const clientId = import.meta.env.VITE_GENI_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GENI_REDIRECT_URI || `${window.location.origin}/`;
  
  if (!clientId) {
    return null;
  }
  
  return { clientId, redirectUri };
};

function GeniConnect() {
  const [client, setClient] = useState<GeniApiClient | null>(null);
  const [connectionState, setConnectionState] = useState<GeniConnectionState>({
    isConnected: false,
    accessToken: null,
    expiresAt: null,
    currentProfileId: null,
    currentProfileName: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadOptions, setLoadOptions] = useState<LoadOptions>({
    includeAncestors: true,
    includeDescendants: true,
    includeSiblings: true,
    generations: 3,
  });

  const loadFamilyTree = useFamilyStore((state) => state.loadFamilyTree);
  const setRelationshipGraph = useFamilyStore((state) => state.setRelationshipGraph);

  // Initialize client
  useEffect(() => {
    const config = getGeniConfig();
    if (!config) {
      setError('Geni API is not configured. Please add VITE_GENI_CLIENT_ID to your environment variables.');
      return;
    }

    const apiClient = new GeniApiClient(config);
    setClient(apiClient);

    // Check if already authenticated
    if (apiClient.isAuthenticated()) {
      apiClient.getCurrentProfile()
        .then(profile => {
          setConnectionState({
            isConnected: true,
            accessToken: apiClient.getAccessToken(),
            expiresAt: null,
            currentProfileId: profile.id,
            currentProfileName: profile.name,
          });
        })
        .catch(() => {
          // Token may be invalid
          apiClient.clearToken();
        });
    }

    // Check for OAuth callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const geniError = urlParams.get('error');

    if (geniError) {
      setError(`Authentication failed: ${geniError}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      handleOAuthCode(apiClient, code);
    }
  }, []);

  const handleOAuthCode = async (apiClient: GeniApiClient, code: string) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.handleOAuthCallback(code);
      const profile = await apiClient.getCurrentProfile();
      
      setConnectionState({
        isConnected: true,
        accessToken: apiClient.getAccessToken(),
        expiresAt: null,
        currentProfileId: profile.id,
        currentProfileName: profile.name,
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete authentication');
      apiClient.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!client) return;
    client.authenticate();
  };

  const handleDisconnect = () => {
    if (!client) return;
    client.clearToken();
    setConnectionState({
      isConnected: false,
      accessToken: null,
      expiresAt: null,
      currentProfileId: null,
      currentProfileName: null,
    });
  };

  const handleLoadData = async () => {
    if (!client || !connectionState.currentProfileId) return;

    setLoading(true);
    setError(null);

    try {
      // Load family tree from Geni
      const { profiles, unions } = await client.loadFamilyTree(
        connectionState.currentProfileId,
        {
          includeAncestors: loadOptions.includeAncestors,
          includeDescendants: loadOptions.includeDescendants,
          generations: loadOptions.generations,
        }
      );

      // Convert to FamilyData format
      const adapter = new GeniDataAdapter();
      const familyData = adapter.convertToFamilyData(profiles, unions);

      // Build relationship graph
      const builder = new RelationshipGraphBuilder();
      const graph = builder.build(familyData);

      // Load into store
      loadFamilyTree(familyData, `Geni: ${connectionState.currentProfileName}`);
      setRelationshipGraph(graph);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family tree');
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">Geni API Not Configured</h3>
            <p className="text-sm text-yellow-700 mt-1">
              To use Geni.com integration, you need to:
            </p>
            <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal space-y-1">
              <li>Register an app at <a href="https://www.geni.com/platform/developer" target="_blank" rel="noopener noreferrer" className="underline">Geni Developer Portal</a></li>
              <li>Add <code className="bg-yellow-100 px-1 rounded">VITE_GENI_CLIENT_ID</code> to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file</li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!connectionState.isConnected) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Globe className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect to Geni.com</h3>
          <p className="text-gray-600 mb-6">
            Access your family tree data from Geni.com
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Connect with Geni
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                You'll be redirected to Geni.com to authorize access to your family tree data. 
                We only request read access and never modify your tree.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-medium">Connected as {connectionState.currentProfileName}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4 inline mr-1" />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Load Options</h4>

        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={loadOptions.includeAncestors}
              onChange={(e) => setLoadOptions(prev => ({
                ...prev,
                includeAncestors: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include Ancestors</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={loadOptions.includeDescendants}
              onChange={(e) => setLoadOptions(prev => ({
                ...prev,
                includeDescendants: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include Descendants</span>
          </label>

          <div className="flex items-center space-x-3">
            <label className="text-sm text-gray-700">Generations:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={loadOptions.generations}
              onChange={(e) => setLoadOptions(prev => ({
                ...prev,
                generations: parseInt(e.target.value) || 3
              }))}
              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-xs text-gray-500">(1-10)</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleLoadData}
        disabled={loading || (!loadOptions.includeAncestors && !loadOptions.includeDescendants)}
        className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Loading Family Tree...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Load Family Tree
          </>
        )}
      </button>

      {!loadOptions.includeAncestors && !loadOptions.includeDescendants && (
        <p className="text-sm text-amber-600 mt-2 text-center">
          Please select at least ancestors or descendants
        </p>
      )}
    </div>
  );
}

export default GeniConnect;
