import { makeBodyMapCoordinator } from './bodyMap.coordinator';
import { bodyMapRepository } from '../../repositories/bodyMap.repository';

/** App-wide body-map coordinator wired to the device-backed repository. */
export const bodyMapCoordinator = makeBodyMapCoordinator(bodyMapRepository);
