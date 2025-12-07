import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GedcomData, Profile, Family, RelationshipGraph } from '@/types/gedcom';

interface GedcomStore {
  // State
  gedcomData: GedcomData | null;
  relationshipGraph: RelationshipGraph | null;
  selectedProfileId: string | null;
  fileName: string | null;
  
  // Actions
  loadGedcom: (data: GedcomData, fileName?: string) => void;
  setRelationshipGraph: (graph: RelationshipGraph) => void;
  selectProfile: (id: string | null) => void;
  clearData: () => void;
  
  // Selectors
  getProfile: (id: string) => Profile | undefined;
  getFamily: (id: string) => Family | undefined;
  getAllProfiles: () => Profile[];
  getSelectedProfile: () => Profile | undefined;
}

export const useGedcomStore = create<GedcomStore>()(
  immer((set, get) => ({
    // Initial state
    gedcomData: null,
    relationshipGraph: null,
    selectedProfileId: null,
    fileName: null,
    
    // Actions
    loadGedcom: (data, fileName) => {
      set((state) => {
        state.gedcomData = data;
        state.fileName = fileName || null;
        // Don't reset selected profile if reloading same file
        if (!state.selectedProfileId && data.indis.length > 0) {
          state.selectedProfileId = data.indis[0].id;
        }
      });
    },
    
    setRelationshipGraph: (graph) => {
      set((state) => {
        state.relationshipGraph = graph;
      });
    },
    
    selectProfile: (id) => {
      set((state) => {
        state.selectedProfileId = id;
      });
    },
    
    clearData: () => {
      set((state) => {
        state.gedcomData = null;
        state.relationshipGraph = null;
        state.selectedProfileId = null;
        state.fileName = null;
      });
    },
    
    // Selectors
    getProfile: (id) => {
      const { gedcomData } = get();
      return gedcomData?.indis.find((i) => i.id === id);
    },
    
    getFamily: (id) => {
      const { gedcomData } = get();
      return gedcomData?.fams.find((f) => f.id === id);
    },
    
    getAllProfiles: () => {
      const { gedcomData } = get();
      return gedcomData?.indis || [];
    },
    
    getSelectedProfile: () => {
      const { selectedProfileId } = get();
      if (!selectedProfileId) return undefined;
      return get().getProfile(selectedProfileId);
    },
  }))
);
