import type { GedcomData, RelationshipGraph, ProfileNode, Profile } from '@/types/gedcom';

/**
 * Build optimized relationship graph from GEDCOM data
 */
export class RelationshipGraphBuilder {
  /**
   * Build relationship graph from GEDCOM data
   */
  build(data: GedcomData): RelationshipGraph {
    const individuals = new Map<string, ProfileNode>();
    const families = new Map(data.fams.map(f => [f.id, f]));
    
    // First pass: create basic nodes
    data.indis.forEach(profile => {
      individuals.set(profile.id, {
        profile,
        spouses: [],
        children: [],
        siblings: [],
      });
    });
    
    // Second pass: build relationships
    data.indis.forEach(profile => {
      const node = individuals.get(profile.id)!;
      
      // Add parents
      if (profile.famc) {
        const family = families.get(profile.famc);
        if (family) {
          node.parents = [family.husb || '', family.wife || ''].filter(Boolean) as [string, string];
          
          // Add siblings
          family.children?.forEach(siblingId => {
            if (siblingId !== profile.id) {
              node.siblings.push({
                siblingId,
                relationship: 'full', // Simplified - could be enhanced
              });
            }
          });
        }
      }
      
      // Add spouses and children
      profile.fams?.forEach(famId => {
        const family = families.get(famId);
        if (!family) return;
        
        // Determine spouse
        const spouseId = family.husb === profile.id ? family.wife : family.husb;
        if (spouseId) {
          node.spouses.push({ spouseId, familyId: famId });
        }
        
        // Add children
        family.children?.forEach(childId => {
          node.children.push({ childId, familyId: famId });
        });
      });
    });
    
    return { individuals, families };
  }
  
  /**
   * Find all ancestors up to specified generation
   */
  getAncestors(
    profileId: string,
    graph: RelationshipGraph,
    generations: number
  ): Profile[] {
    const result: Profile[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string, depth: number) => {
      if (depth > generations || visited.has(id)) return;
      visited.add(id);
      
      const node = graph.individuals.get(id);
      if (!node) return;
      
      result.push(node.profile);
      
      node.parents?.forEach(parentId => {
        if (parentId) traverse(parentId, depth + 1);
      });
    };
    
    traverse(profileId, 0);
    return result;
  }
  
  /**
   * Find all descendants up to specified generation
   */
  getDescendants(
    profileId: string,
    graph: RelationshipGraph,
    generations: number
  ): Profile[] {
    const result: Profile[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string, depth: number) => {
      if (depth > generations || visited.has(id)) return;
      visited.add(id);
      
      const node = graph.individuals.get(id);
      if (!node) return;
      
      result.push(node.profile);
      
      node.children.forEach(({ childId }) => {
        traverse(childId, depth + 1);
      });
    };
    
    traverse(profileId, 0);
    return result;
  }
  
  /**
   * Get immediate family
   */
  getImmediateFamily(
    profileId: string,
    graph: RelationshipGraph
  ) {
    const node = graph.individuals.get(profileId);
    if (!node) {
      return { parents: [], spouses: [], children: [], siblings: [] };
    }
    
    const parents = (node.parents || [])
      .map(id => graph.individuals.get(id)?.profile)
      .filter(Boolean) as Profile[];
    
    const spouses = node.spouses
      .map(({ spouseId }) => graph.individuals.get(spouseId)?.profile)
      .filter(Boolean) as Profile[];
    
    const children = node.children
      .map(({ childId }) => graph.individuals.get(childId)?.profile)
      .filter(Boolean) as Profile[];
    
    const siblings = node.siblings
      .map(({ siblingId }) => graph.individuals.get(siblingId)?.profile)
      .filter(Boolean) as Profile[];
    
    return { parents, spouses, children, siblings };
  }
}
