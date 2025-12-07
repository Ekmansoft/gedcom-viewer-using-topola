import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { FamilyData, Profile, Family, RelationshipGraph } from '@/types/family';

interface FamilyStore {
  // State
  familyData: FamilyData | null;
  relationshipGraph: RelationshipGraph | null;
  selectedProfileId: string | null;
  fileName: string | null;
  
  // Actions
  loadFamilyTree: (data: FamilyData, fileName?: string) => void;
  setRelationshipGraph: (graph: RelationshipGraph) => void;
  selectProfile: (id: string | null) => void;
  clearData: () => void;
  
  // Selectors
  getProfile: (id: string) => Profile | undefined;
  getFamily: (id: string) => Family | undefined;
  getAllProfiles: () => Profile[];
  getSelectedProfile: () => Profile | undefined;
}

export const useFamilyStore = create<FamilyStore>()(
  immer((set, get) => ({
    // Initial state
    familyData: null,
    relationshipGraph: null,
    selectedProfileId: null,
    fileName: null,
    
    // Actions
    loadFamilyTree: (data, fileName) => {
      set((state) => {
        state.familyData = data;
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
        state.familyData = null;
        state.relationshipGraph = null;
        state.selectedProfileId = null;
        state.fileName = null;
      });
    },
    
    // Selectors
    getProfile: (id) => {
      const { familyData } = get();
      return familyData?.indis.find((i) => i.id === id);
    },
    
    getFamily: (id) => {
      const { familyData } = get();
      return familyData?.fams.find((f) => f.id === id);
    },
    
    getAllProfiles: () => {
      const { familyData } = get();
      return familyData?.indis || [];
    },
    
    getSelectedProfile: () => {
      const { selectedProfileId } = get();
      if (!selectedProfileId) return undefined;
      return get().getProfile(selectedProfileId);
    },
  }))
);
