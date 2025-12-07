/**
 * Data source type definitions
 */

export type DataSourceType = 'gedcom' | 'geni';

export interface DataSource {
  type: DataSourceType;
  name: string;
  timestamp: Date;
  metadata?: DataSourceMetadata;
}

export interface DataSourceMetadata {
  // For GEDCOM files
  fileName?: string;
  fileSize?: number;
  
  // For Geni
  geniProfileId?: string;
  geniProfileName?: string;
  generationsLoaded?: number;
  profilesLoaded?: number;
}

export interface GeniConnectionState {
  isConnected: boolean;
  accessToken: string | null;
  expiresAt: Date | null;
  currentProfileId: string | null;
  currentProfileName: string | null;
}

export interface LoadOptions {
  includeAncestors: boolean;
  includeDescendants: boolean;
  includeSiblings: boolean;
  generations: number;
}
