import type { Migration } from '../migrate';
import { m1Initial } from './m1-initial';
import { m2Theme } from './m2-theme';

export const migrations: Migration[] = [m1Initial, m2Theme];
