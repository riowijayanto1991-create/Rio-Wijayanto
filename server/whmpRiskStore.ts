import fs from 'fs';
import path from 'path';
import {
  RiskMatrixConfig,
  WHMPZone,
  WHMPSpecies,
  LikelihoodComputationConfig,
  ProposedSpecies
} from '../src/types/whmpRisk';
import {
  WHMP_RISK_MATRIX,
  WHMP_ZONES,
  WHMP_LIKELIHOOD_CONFIG,
  WHMP_60_SPECIES
} from '../src/config/whmpRiskConfig';

interface WhmpStorageSchema {
  version: string;
  lastUpdated: string;
  matrixConfig: RiskMatrixConfig;
  zones: WHMPZone[];
  likelihoodConfig: LikelihoodComputationConfig;
  speciesCatalog: WHMPSpecies[];
  proposedSpecies: ProposedSpecies[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'whmpRiskStore.json');

class WhmpRiskStore {
  private store: WhmpStorageSchema;

  constructor() {
    this.store = this.loadOrCreateStore();
  }

  private loadOrCreateStore(): WhmpStorageSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.speciesCatalog)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing whmpRiskStore.json, seeding defaults:', err);
    }

    const initial: WhmpStorageSchema = {
      version: '1.0.0-WHMP-CH2',
      lastUpdated: new Date().toISOString(),
      matrixConfig: WHMP_RISK_MATRIX,
      zones: WHMP_ZONES,
      likelihoodConfig: WHMP_LIKELIHOOD_CONFIG,
      speciesCatalog: WHMP_60_SPECIES,
      proposedSpecies: [
        {
          id: 'prop-sp-01',
          common_name_id: 'Musang Rase (Luwak Rase)',
          common_name_en: 'Small Indian Civet',
          proposed_latin_name: 'Viverricula indica',
          group: 'Mamalia',
          proposed_severity: 2,
          severity_justification: 'Bobot tubuh 2.5 kg, teramati menyeberang taxiway South Cargo di malam hari.',
          estimated_likelihood: 'B',
          first_observed_date: '2026-03-12',
          first_observed_zone_id: 'zone-4',
          first_observed_location_desc: 'Apron Terminal Kargo Selatan',
          estimated_population: 3,
          proposed_by_name: 'Darmawan (WHU Airside Officer)',
          proposed_by_user_id: 'usr-officer-01',
          proposed_at: '2026-03-14T02:30:00Z',
          status: 'UNDER_REVIEW',
          review_notes: 'Menunggu konfirmasi verifikasi jebakan kamera (camera trap) di perimeter kargo.'
        },
        {
          id: 'prop-sp-02',
          common_name_id: 'Kuntul Karang',
          common_name_en: 'Pacific Reef Heron',
          proposed_latin_name: 'Egretta sacra',
          group: 'Burung (Aves)',
          proposed_severity: 3,
          severity_justification: 'Fase morph gelap mirip gagak, mencari makan di saluran buangan air RWY 3.',
          estimated_likelihood: 'B',
          first_observed_date: '2026-04-05',
          first_observed_zone_id: 'zone-1',
          first_observed_location_desc: 'Bahu Runway 3 (06-24) Grid C12',
          estimated_population: 2,
          proposed_by_name: 'Rudi Hermawan (Pleton Alpha)',
          proposed_by_user_id: 'usr-officer-02',
          proposed_at: '2026-04-06T08:15:00Z',
          status: 'PROPOSED'
        }
      ]
    };

    this.saveStore(initial);
    return initial;
  }

  private saveStore(data?: WhmpStorageSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const toWrite = data || this.store;
      toWrite.lastUpdated = new Date().toISOString();
      fs.writeFileSync(STORE_PATH, JSON.stringify(toWrite, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save whmpRiskStore.json:', err);
    }
  }

  public getConfig() {
    return {
      version: this.store.version,
      lastUpdated: this.store.lastUpdated,
      matrixConfig: this.store.matrixConfig,
      zones: this.store.zones,
      likelihoodConfig: this.store.likelihoodConfig
    };
  }

  public getSpeciesCatalog(): WHMPSpecies[] {
    return this.store.speciesCatalog;
  }

  public getSpeciesById(id: string): WHMPSpecies | undefined {
    return this.store.speciesCatalog.find(s => s.id === id);
  }

  public updateTaxonomicStatus(
    speciesId: string, 
    status: 'Needs taxonomic review' | 'Verified',
    correctedName?: string,
    notes?: string
  ): WHMPSpecies | null {
    const sp = this.store.speciesCatalog.find(s => s.id === speciesId);
    if (!sp) return null;

    sp.taxonomic_status = status;
    if (correctedName) {
      sp.latin_name_corrected = correctedName.trim();
    }
    if (notes !== undefined) {
      sp.taxonomic_notes = notes;
    }
    this.saveStore();
    return sp;
  }

  public approveThresholds(approvedByName: string, remarks?: string): LikelihoodComputationConfig {
    this.store.likelihoodConfig.isApproved = true;
    this.store.likelihoodConfig.isPlaceholder = false;
    this.store.likelihoodConfig.approvedBy = approvedByName;
    this.store.likelihoodConfig.approvedAt = new Date().toISOString();
    this.store.likelihoodConfig.approvalRemarks = remarks || 'Disetujui secara resmi oleh Wildlife Hazard Management Team.';
    this.saveStore();
    return this.store.likelihoodConfig;
  }

  public getProposedSpecies(): ProposedSpecies[] {
    return this.store.proposedSpecies;
  }

  public addProposedSpecies(item: Omit<ProposedSpecies, 'id' | 'proposed_at' | 'status'>): ProposedSpecies {
    const newEntry: ProposedSpecies = {
      ...item,
      id: `prop-sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      proposed_at: new Date().toISOString(),
      status: 'PROPOSED'
    };
    this.store.proposedSpecies.unshift(newEntry);
    this.saveStore();
    return newEntry;
  }

  public reviewProposedSpecies(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'UNDER_REVIEW',
    reviewedByName: string,
    reviewedByUserId: string,
    reviewNotes?: string
  ): { proposed: ProposedSpecies; addedToCatalog?: WHMPSpecies } | null {
    const item = this.store.proposedSpecies.find(p => p.id === id);
    if (!item) return null;

    item.reviewed_by_name = reviewedByName;
    item.reviewed_by_user_id = reviewedByUserId;
    item.reviewed_at = new Date().toISOString();
    if (reviewNotes) {
      item.review_notes = reviewNotes;
    }

    let addedSpecies: WHMPSpecies | undefined;

    if (action === 'APPROVE') {
      item.status = 'APPROVED';
      
      // Calculate matrix cell for the new species
      const row = this.store.matrixConfig[item.estimated_likelihood];
      const cell = row[item.proposed_severity];

      const newCatalogItem: WHMPSpecies = {
        id: `whmp-sp-new-${Date.now().toString(36)}`,
        species_number: this.store.speciesCatalog.length + 1,
        common_name_id: item.common_name_id,
        common_name_en: item.common_name_en,
        latin_name_as_written: item.proposed_latin_name,
        latin_name_corrected: item.proposed_latin_name,
        taxonomic_status: 'Needs taxonomic review',
        taxonomic_notes: `Spesies baru disetujui dari permohonan petugas (${reviewedByName}).`,
        group: item.group,
        likelihood_level: {
          letter: item.estimated_likelihood,
          number: item.estimated_likelihood === 'A' ? 1 : item.estimated_likelihood === 'B' ? 2 : item.estimated_likelihood === 'C' ? 3 : item.estimated_likelihood === 'D' ? 4 : 5,
          labelId: `Level ${item.estimated_likelihood}`,
          labelEn: `Level ${item.estimated_likelihood}`
        },
        severity_level: item.proposed_severity,
        risk_score: cell.score,
        risk_tier: cell.tier,
        recomputed_score: cell.score,
        recomputed_tier: cell.tier,
        has_discrepancy: false,
        primary_habitat: item.first_observed_location_desc || 'Airside CGK',
        whmp_notes: `Diusulkan oleh ${item.proposed_by_name} pada ${item.first_observed_date}. Catatan review: ${item.review_notes || '-'}`
      };

      this.store.speciesCatalog.push(newCatalogItem);
      addedSpecies = newCatalogItem;
    } else if (action === 'REJECT') {
      item.status = 'REJECTED';
    } else if (action === 'UNDER_REVIEW') {
      item.status = 'UNDER_REVIEW';
    }

    this.saveStore();
    return { proposed: item, addedToCatalog: addedSpecies };
  }
}

export const whmpRiskStore = new WhmpRiskStore();
