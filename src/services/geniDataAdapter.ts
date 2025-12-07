import type { FamilyData, Profile, Family, DateInfo, LifeEvent } from '@/types/family';
import type { GeniProfile, GeniUnion, GeniDate, GeniEvent } from '@/types/geni';

/**
 * Adapter to convert Geni API data to FamilyData format
 */
export class GeniDataAdapter {
  /**
   * Convert Geni profiles and unions to FamilyData format
   */
  convertToFamilyData(profiles: GeniProfile[], unions: GeniUnion[]): FamilyData {
    const indis: Profile[] = profiles.map(p => this.convertProfile(p));
    const fams: Family[] = unions.map(u => this.convertUnion(u, profiles));

    return {
      indis,
      fams,
      metadata: {
        source: 'Geni.com',
        createdDate: new Date().toISOString(),
      },
    };
  }

  /**
   * Convert Geni profile to internal Profile format
   */
  private convertProfile(geniProfile: GeniProfile): Profile {
    // Build family references
    const fams: string[] = [];
    if (geniProfile.unions) {
      fams.push(...geniProfile.unions.map(u => `@${u}@`));
    }

    return {
      id: `@${geniProfile.id}@`,
      firstName: geniProfile.first_name,
      lastName: geniProfile.last_name,
      maidenName: geniProfile.maiden_name,
      sex: this.convertGender(geniProfile.gender),
      birth: geniProfile.birth ? this.convertEvent(geniProfile.birth) : undefined,
      death: geniProfile.death ? this.convertEvent(geniProfile.death) : undefined,
      fams: fams.length > 0 ? fams : undefined,
      images: geniProfile.photo_urls?.map(p => ({
        url: p.url,
      })),
      // Store additional events if present
      events: this.convertAdditionalEvents(geniProfile),
    };
  }

  /**
   * Convert Geni union to internal Family format
   */
  private convertUnion(geniUnion: GeniUnion, profiles: GeniProfile[]): Family {
    // Geni unions can use profile_1/profile_2 or partners array
    let husb: string | undefined;
    let wife: string | undefined;

    if (geniUnion.partners && geniUnion.partners.length >= 2) {
      // Determine gender from profiles
      const partner1 = profiles.find(p => p.id === geniUnion.partners![0]);
      const partner2 = profiles.find(p => p.id === geniUnion.partners![1]);

      if (partner1?.gender === 'male') {
        husb = `@${partner1.id}@`;
      } else if (partner1?.gender === 'female') {
        wife = `@${partner1.id}@`;
      }

      if (partner2?.gender === 'male') {
        husb = `@${partner2.id}@`;
      } else if (partner2?.gender === 'female') {
        wife = `@${partner2.id}@`;
      }

      // If genders unknown, assign arbitrarily
      if (!husb && !wife) {
        husb = partner1 ? `@${partner1.id}@` : undefined;
        wife = partner2 ? `@${partner2.id}@` : undefined;
      }
    } else if (geniUnion.profile_1 || geniUnion.profile_2) {
      const partner1 = profiles.find(p => p.id === geniUnion.profile_1);
      const partner2 = profiles.find(p => p.id === geniUnion.profile_2);

      if (partner1?.gender === 'male') {
        husb = `@${partner1.id}@`;
      } else if (partner1?.gender === 'female') {
        wife = `@${partner1.id}@`;
      }

      if (partner2?.gender === 'male') {
        husb = `@${partner2.id}@`;
      } else if (partner2?.gender === 'female') {
        wife = `@${partner2.id}@`;
      }

      // If genders unknown, assign arbitrarily
      if (!husb && !wife) {
        husb = geniUnion.profile_1 ? `@${geniUnion.profile_1}@` : undefined;
        wife = geniUnion.profile_2 ? `@${geniUnion.profile_2}@` : undefined;
      }
    }

    return {
      id: `@${geniUnion.id}@`,
      husb,
      wife,
      children: geniUnion.children?.map(c => `@${c}@`),
      marriage: geniUnion.marriage ? this.convertEvent(geniUnion.marriage) : undefined,
      divorce: geniUnion.divorce ? this.convertEvent(geniUnion.divorce) : undefined,
    };
  }

  /**
   * Convert Geni gender to internal format
   */
  private convertGender(gender?: 'male' | 'female'): 'M' | 'F' | 'U' | undefined {
    if (!gender) return undefined;
    return gender === 'male' ? 'M' : 'F';
  }

  /**
   * Convert Geni event to internal LifeEvent format
   */
  private convertEvent(geniEvent: GeniEvent): LifeEvent {
    return {
      date: geniEvent.date ? this.convertDate(geniEvent.date) : undefined,
      place: geniEvent.location?.formatted_location,
      confirmed: true,
    };
  }

  /**
   * Convert Geni date to internal DateInfo format
   */
  private convertDate(geniDate: GeniDate): DateInfo {
    let qualifier: DateInfo['qualifier'] = undefined;
    
    if (geniDate.circa) {
      qualifier = 'abt';
    } else if (geniDate.before) {
      qualifier = 'before';
    } else if (geniDate.after) {
      qualifier = 'after';
    }

    return {
      year: geniDate.year,
      month: geniDate.month,
      day: geniDate.day,
      text: geniDate.formatted_date,
      qualifier,
    };
  }

  /**
   * Convert additional events (baptism, burial, etc.)
   */
  private convertAdditionalEvents(geniProfile: GeniProfile): LifeEvent[] | undefined {
    const events: LifeEvent[] = [];

    if (geniProfile.baptism) {
      events.push({
        ...this.convertEvent(geniProfile.baptism),
        type: 'baptism',
      });
    }

    if (geniProfile.burial) {
      events.push({
        ...this.convertEvent(geniProfile.burial),
        type: 'burial',
      });
    }

    return events.length > 0 ? events : undefined;
  }

  /**
   * Create a placeholder for private/inaccessible profiles
   */
  static createPrivateProfilePlaceholder(profileId: string): Profile {
    return {
      id: `@${profileId}@`,
      firstName: 'Private',
      lastName: 'Profile',
      sex: 'U',
      hideId: true,
    };
  }
}
