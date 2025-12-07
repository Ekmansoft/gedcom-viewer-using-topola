/**
 * Types for Geni.com API integration
 */

export interface GeniDate {
  year?: number;
  month?: number;
  day?: number;
  circa?: boolean;
  before?: boolean;
  after?: boolean;
  formatted_date?: string;
}

export interface GeniLocation {
  formatted_location?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface GeniEvent {
  date?: GeniDate;
  location?: GeniLocation;
}

export interface GeniPhotoUrl {
  url: string;
  is_primary?: boolean;
}

export interface GeniProfile {
  id: string;
  guid: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maiden_name?: string;
  suffix?: string;
  nicknames?: string[];
  
  gender?: 'male' | 'female';
  
  birth?: GeniEvent;
  death?: GeniEvent;
  baptism?: GeniEvent;
  burial?: GeniEvent;
  
  photo_urls?: GeniPhotoUrl[];
  
  unions?: string[]; // union IDs
  
  // Privacy
  is_private?: boolean;
  claimed?: boolean;
  
  // URLs
  url?: string;
  profile_url?: string;
}

export interface GeniUnion {
  id: string;
  profile_1?: string; // profile ID
  profile_2?: string; // profile ID
  partners?: string[]; // profile IDs (alternative representation)
  children?: string[]; // profile IDs
  status?: 'married' | 'divorced' | 'partner' | 'engaged' | 'relationship';
  marriage?: GeniEvent;
  divorce?: GeniEvent;
}

export interface GeniImmediateFamily {
  focus: GeniProfile;
  parents?: GeniProfile[];
  siblings?: GeniProfile[];
  spouses?: GeniProfile[];
  children?: GeniProfile[];
  unions?: GeniUnion[];
}

export interface GeniError {
  error: string;
  message?: string;
  status?: number;
}

export interface GeniConfig {
  clientId: string;
  redirectUri: string;
}

export interface GeniAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
