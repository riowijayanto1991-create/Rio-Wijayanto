export type LikelihoodLetter = 'A' | 'B' | 'C' | 'D' | 'E';
export type LikelihoodNumber = 1 | 2 | 3 | 4 | 5;

export interface LikelihoodLevel {
  letter: LikelihoodLetter;
  number: LikelihoodNumber;
  labelId: string; // e.g. "Sangat Sangat Jarang" .. "Sangat Besar"
  labelEn: string;
}

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export interface SeverityDefinition {
  level: SeverityLevel;
  labelId: string;
  labelEn: string;
  criteriaAircraft: string;
  criteriaOperation: string;
}

export type RiskTier = 
  | 'Low' 
  | 'Low to Moderate' 
  | 'Moderate' 
  | 'Moderate to High' 
  | 'High';

export interface MatrixCell {
  score: number;
  tier: RiskTier;
  actionRequired: string;
  colorCode: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
  };
}

export type RiskMatrixConfig = Record<LikelihoodLetter, Record<SeverityLevel, MatrixCell>>;

export interface WHMPZone {
  id: string;
  zoneNumber: number;
  name: string;
  code: string;
  description: string;
  isCritical: boolean; // Zones 1..3 flagged as critical per WHMP
  airsideArea: string;
}

export type TaxonomicStatus = 'Needs taxonomic review' | 'Verified';

export type FaunaGroup = 
  | 'Burung (Aves)' 
  | 'Mamalia' 
  | 'Reptil' 
  | 'Amfibi' 
  | 'Lainnya';

export interface WHMPSpecies {
  id: string;
  species_number?: number;
  common_name_id: string;
  common_name_en: string;
  latin_name_as_written: string; // Exactly as written in WHMP document
  latin_name_corrected: string;  // Taxonomically validated name
  taxonomic_status: TaxonomicStatus;
  taxonomic_notes?: string;
  group: FaunaGroup;
  
  // Baseline WHMP Chapter II assessments
  likelihood_level: LikelihoodLevel;
  severity_level: SeverityLevel;
  risk_score: number; // Read-only baseline from WHMP document
  risk_tier: RiskTier; // Read-only baseline from WHMP document

  // Dynamically recomputed values from matrix lookup table
  recomputed_score: number;
  recomputed_tier: RiskTier;
  has_discrepancy: boolean;
  discrepancy_detail?: string;

  // Biology & Habitat attributes
  weight_grams?: number;
  flocking_tendency?: string;
  primary_habitat?: string;
  whmp_notes?: string;
}

export interface LikelihoodThresholdTier {
  letter: LikelihoodLetter;
  number: LikelihoodNumber;
  min: number;
  max: number | null; // null for no upper limit (e.g. > 100)
  displayLabel: string;
}

export interface LikelihoodComputationConfig {
  approach1_daysObserved: {
    title: string;
    description: string;
    unit: string;
    thresholds: LikelihoodThresholdTier[];
  };
  approach2_strikesAverage: {
    title: string;
    description: string;
    unit: string;
    thresholds: LikelihoodThresholdTier[];
  };
  isPlaceholder: boolean;
  placeholderNotice: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvalRemarks?: string;
}

export type ProposedSpeciesStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ProposedSpecies {
  id: string;
  common_name_id: string;
  common_name_en: string;
  proposed_latin_name: string;
  group: FaunaGroup;
  proposed_severity: SeverityLevel;
  severity_justification: string;
  estimated_likelihood: LikelihoodLetter;
  first_observed_date: string;
  first_observed_zone_id: string;
  first_observed_location_desc?: string;
  estimated_population?: number;
  photo_url?: string;
  proposed_by_name: string;
  proposed_by_user_id: string;
  proposed_at: string;
  status: ProposedSpeciesStatus;
  review_notes?: string;
  reviewed_by_name?: string;
  reviewed_by_user_id?: string;
  reviewed_at?: string;
}

export interface SpeciesActualComparison {
  species: WHMPSpecies;
  whmp_likelihood: LikelihoodLetter;
  whmp_likelihood_number: number;
  whmp_severity: SeverityLevel;
  whmp_score: number;
  whmp_tier: RiskTier;

  // Computed from actual reports
  actual_days_observed_year: number;
  actual_total_sightings_count: number;
  actual_strikes_count: number;
  actual_strikes_per_year: number;
  computed_likelihood_approach1: LikelihoodLetter;
  computed_likelihood_approach2: LikelihoodLetter;
  computed_likelihood_adopted: LikelihoodLetter;
  computed_score: number;
  computed_tier: RiskTier;

  // Variance & Revision Rationale
  variance_tier: 'INCREASED' | 'DECREASED' | 'STABLE';
  variance_score: number; // computed_score - whmp_score
  revision_recommendation: string;
}
