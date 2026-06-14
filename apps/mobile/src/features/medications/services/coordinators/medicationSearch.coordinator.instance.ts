import { makeMedicationSearchCoordinator } from './medicationSearch.coordinator';
import { medicationCatalogRepository } from '../../repositories/medicationCatalog.repository';

export const medicationSearchCoordinator = makeMedicationSearchCoordinator(medicationCatalogRepository);
