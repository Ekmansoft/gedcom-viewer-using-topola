/**
 * Core data types for family tree data structure
 * This format is source-agnostic and can be populated from GEDCOM files,
 * Geni API, or other genealogy data sources
 */

export interface DateInfo {
  day?: number;
  month?: number;
  year?: number;
  text?: string;
  qualifier?: 'cal' | 'abt' | 'est' | 'before' | 'after';
}

export interface DateRange {
  from?: DateInfo;
  to?: DateInfo;
}

export interface ProfileImage {
  url: string;
  title?: string;
  thumbnail?: string;
}

export interface LifeEvent {
  date?: DateInfo;
  dateRange?: DateRange;
  place?: string;
  confirmed?: boolean;
  type?: string;
  notes?: string[];
}

export interface Profile {
  id: string;
  firstName?: string;
  lastName?: string;
  maidenName?: string;
  sex?: 'M' | 'F' | 'U' | 'X';
  
  // Relationships
  famc?: string;
  fams?: string[];
  
  // Life events
  birth?: LifeEvent;
  death?: LifeEvent;
  events?: LifeEvent[];
  
  // Additional data
  images?: ProfileImage[];
  notes?: string[];
  numberOfChildren?: number;
  numberOfMarriages?: number;
  
  // UI metadata
  hideId?: boolean;
  hideSex?: boolean;
}

export interface Family {
  id: string;
  husb?: string;
  wife?: string;
  children?: string[];
  marriage?: LifeEvent;
  divorce?: LifeEvent;
  notes?: string[];
}

export interface FamilyData {
  indis: Profile[];
  fams: Family[];
  metadata?: {
    source?: string;
    version?: string;
    createdDate?: string;
    creator?: string;
  };
}

export interface ProfileNode {
  profile: Profile;
  parents?: [string, string];
  spouses: Array<{
    spouseId: string;
    familyId: string;
  }>;
  children: Array<{
    childId: string;
    familyId: string;
  }>;
  siblings: Array<{
    siblingId: string;
    relationship: 'full' | 'half' | 'step';
  }>;
}

export interface RelationshipGraph {
  individuals: Map<string, ProfileNode>;
  families: Map<string, Family>;
}
