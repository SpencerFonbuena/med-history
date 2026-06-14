import { makeEntriesCoordinator } from './entries.coordinator';
import { entriesRepository } from '../../repositories/entries.repository';

/** App-wide entries coordinator wired to the device-backed repository. */
export const entriesCoordinator = makeEntriesCoordinator(entriesRepository);
