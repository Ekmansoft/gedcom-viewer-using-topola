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
        console.log('⚠️ Created unknown husband for family:', fam.id);
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
        console.log('⚠️ Created unknown wife for family:', fam.id);
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
    
    // Debug: Log profiles with multiple marriages
    if (profile.fams && profile.fams.length > 1) {
      console.log('👥 Profile with multiple marriages:', {
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`,
        marriages: profile.fams
      });
    }
    
    // Special debug for Signe Maria
    if (profile.id === '@profile-66938338@') {
      console.log('🎯 Signe Maria Profile Data:', {
        id: profile.id,
        fullName: `${profile.firstName} ${profile.lastName}`,
        sex: profile.sex,
        fams: profile.fams,
        famc: profile.famc
      });
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
    
    // Debug: Log family data to trace the marriage issue
    if (family.id.includes('66938338') || (family.husb && family.husb.includes('66938338')) || (family.wife && family.wife.includes('66938338'))) {
      console.log('🔍 Family involving Signe Maria:', {
        familyId: family.id,
        husb: family.husb,
        wife: family.wife,
        children: family.children
      });
    }
    
    // Check if husb and wife are the same
    if (family.husb && family.wife && family.husb === family.wife) {
      console.warn('⚠️ Family has same person as both husband and wife:', {
        familyId: family.id,
        husb: family.husb,
        wife: family.wife
      });
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
