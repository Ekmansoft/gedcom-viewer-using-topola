import { parse as parseGedcom } from 'gedcom';
import type { GedcomData, Profile, Family } from '@/types/gedcom';

/**
 * Parse GEDCOM file content into structured data
 */
export class GedcomParser {
  /**
   * Parse GEDCOM string content
   */
  async parse(content: string): Promise<GedcomData> {
    try {
      // Use gedcom library to parse
      const parsed = parseGedcom(content);
      
      console.log('Parsed GEDCOM structure:', parsed);
      
      // Transform to our data structure
      const indis: Profile[] = [];
      const fams: Family[] = [];
      
      // The gedcom library returns a root object with children array
      if (parsed.children && Array.isArray(parsed.children)) {
        parsed.children.forEach((record: any) => {
          if (record.type === 'INDI') {
            const indi = this.extractIndividual(record);
            if (indi) indis.push(indi);
          } else if (record.type === 'FAM') {
            const fam = this.extractFamily(record);
            if (fam) fams.push(fam);
          }
        });
      }
      
      console.log('Extracted individuals:', indis.length);
      console.log('Extracted families:', fams.length);
      
      return { indis, fams };
    } catch (error) {
      console.error('GEDCOM parse error:', error);
      throw new Error('Failed to parse GEDCOM file: ' + (error as Error).message);
    }
  }
  
  private extractIndividual(record: any): Profile | null {
    if (!record.data?.xref_id) return null;
    
    const indi: Profile = {
      id: record.data.xref_id,
    };
    
    // Process child records
    record.children?.forEach((child: any) => {
      switch (child.type) {
        case 'NAME':
          const nameParts = this.parseName(child.data?.value || '');
          indi.firstName = nameParts.firstName;
          indi.lastName = nameParts.lastName;
          break;
        case 'SEX':
          indi.sex = this.normalizeSex(child.data?.value);
          break;
        case 'BIRT':
          indi.birth = this.extractEventFromChildren(child.children);
          break;
        case 'DEAT':
          indi.death = this.extractEventFromChildren(child.children);
          break;
        case 'FAMC':
          indi.famc = child.data?.pointer;
          break;
        case 'FAMS':
          if (!indi.fams) indi.fams = [];
          if (child.data?.pointer) {
            indi.fams.push(child.data.pointer);
          }
          break;
      }
    });
    
    return indi;
  }
  
  private extractFamily(record: any): Family | null {
    if (!record.data?.xref_id) return null;
    
    const fam: Family = {
      id: record.data.xref_id,
    };
    
    // Process child records
    record.children?.forEach((child: any) => {
      switch (child.type) {
        case 'HUSB':
          fam.husb = child.data?.pointer;
          break;
        case 'WIFE':
          fam.wife = child.data?.pointer;
          break;
        case 'CHIL':
          if (!fam.children) fam.children = [];
          if (child.data?.pointer) {
            fam.children.push(child.data.pointer);
          }
          break;
        case 'MARR':
          fam.marriage = this.extractEventFromChildren(child.children);
          break;
      }
    });
    
    return fam;
  }
  
  private parseName(nameString: string): { firstName?: string; lastName?: string } {
    // GEDCOM names are in format: FirstName /LastName/
    const match = nameString.match(/^([^/]*)\s*\/([^/]+)\//);
    if (match) {
      return {
        firstName: match[1].trim() || undefined,
        lastName: match[2].trim() || undefined,
      };
    }
    return { firstName: nameString };
  }
  
  private extractEventFromChildren(children: any[]): any {
    if (!children) return undefined;
    
    const event: any = { confirmed: true };
    
    children.forEach((child: any) => {
      if (child.type === 'DATE') {
        event.date = this.parseDate(child.data?.value || '');
      } else if (child.type === 'PLAC') {
        event.place = child.data?.value;
      }
    });
    
    return event;
  }
  
  /**
   * Parse GEDCOM file (browser)
   */
  async parseFile(file: File): Promise<GedcomData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = await this.parse(content);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  
  private normalizeSex(sex: any): 'M' | 'F' | 'U' | 'X' | undefined {
    if (!sex) return undefined;
    const s = String(sex).toUpperCase();
    if (s === 'M' || s === 'MALE') return 'M';
    if (s === 'F' || s === 'FEMALE') return 'F';
    if (s === 'X' || s === 'OTHER') return 'X';
    return 'U';
  }
  
  private parseDate(dateStr: string): any {
    if (!dateStr) return undefined;
    
    // Simple date parsing - can be enhanced
    const parts = dateStr.trim().split(' ');
    const result: any = { text: dateStr };
    
    if (parts.length >= 3) {
      result.day = parseInt(parts[0]);
      result.month = this.monthToNumber(parts[1]);
      result.year = parseInt(parts[2]);
    } else if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
      result.year = parseInt(parts[0]);
    }
    
    return result;
  }
  
  
  private monthToNumber(month: string): number {
    const months: Record<string, number> = {
      JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
      JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
    };
    return months[month.toUpperCase()] || 0;
  }
}
