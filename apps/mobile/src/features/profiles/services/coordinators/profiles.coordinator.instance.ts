import { makeProfilesCoordinator } from './profiles.coordinator';
import { profilesRepository } from '../../repositories/profiles.repository';

/** App-wide profiles coordinator wired to the device-backed repository. */
export const profilesCoordinator = makeProfilesCoordinator(profilesRepository);
