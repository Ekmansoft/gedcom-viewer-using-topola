import type { GedcomData, Profile, Family } from '@/types/gedcom';

/**
 * Convert our GEDCOM data format to Topola's expected format
 */
export class TopolaDataAdapter {
  /**
   * Convert to Topola JsonGedcomData format
   */
  convertToTopolaFormat(data: GedcomData): any {
    // Create placeholder individuals for missing spouses
    const unknownIndividuals: any[] = [];
    const processedFamilies = data.fams.map(fam => {
      const processed = { ...fam };
      
      if (!fam.husb) {
        const unknownId = `@unknown-husb-${fam.id}@`;
        unknownIndividuals.push({
          id: unknownId,
          firstName: 'Unknown',
          lastName: 'Husband',
          sex: 'M'
        });
        processed.husb = unknownId;
      }
      
      if (!fam.wife) {
        const unknownId = `@unknown-wife-${fam.id}@`;
        unknownIndividuals.push({
          id: unknownId,
          firstName: 'Unknown',
          lastName: 'Wife',
          sex: 'F'
        });
        processed.wife = unknownId;
      }
      
      return processed;
    });

    return {
      indis: [
        ...data.indis.map(indi => this.convertIndividual(indi)),
        ...unknownIndividuals
      ],
      fams: processedFamilies.map(fam => this.convertFamily(fam)),
    };
  }

  private convertIndividual(profile: Profile): any {
    const result: any = {
      id: profile.id,
      sex: profile.sex || 'U',
    };

    // Name - Topola uses 'firstName' (singular), not 'firstNames' (plural)
    if (profile.firstName || profile.lastName) {
      result.firstName = profile.firstName || '';
      result.lastName = profile.lastName || '';
    }

    // Family relationships
    if (profile.famc) {
      result.famc = profile.famc;
    }
    if (profile.fams && profile.fams.length > 0) {
      result.fams = profile.fams;
    }

    // Birth
    if (profile.birth) {
      result.birth = this.convertEvent(profile.birth);
    }

    // Death
    if (profile.death) {
      result.death = this.convertEvent(profile.death);
    }

    // Images
    if (profile.images && profile.images.length > 0) {
      result.imageUrl = profile.images[0].url;
    }

    return result;
  }

  private convertFamily(family: Family): any {
    const result: any = {
      id: family.id,
    };

    if (family.husb) {
      result.husb = family.husb;
    }
    if (family.wife) {
      result.wife = family.wife;
    }
    
    if (family.children && family.children.length > 0) {
      result.children = family.children;
    }
    if (family.marriage) {
      result.marriage = this.convertEvent(family.marriage);
    }

    return result;
  }

  private convertEvent(event: any): any {
    const result: any = {};

    if (event.date) {
      const { day, month, year } = event.date;
      if (year) {
        result.date = {
          year,
          ...(month && { month }),
          ...(day && { day }),
        };
      }
    }

    if (event.place) {
      result.place = event.place;
    }

    return result;
  }
}
