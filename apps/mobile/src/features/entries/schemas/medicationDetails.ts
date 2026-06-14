/** The catalog linkage stored in an entry's `details` JSON for prescriptions. */
export interface MedicationDetails {
  rxcui: string;
  strength?: string;
  doseForm?: string;
}
