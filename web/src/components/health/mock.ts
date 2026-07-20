import { HealthData } from './types';

// Used when running the UI in the browser (npm run dev) so the page has
// something to render without the game client pushing data.
export const MOCK_HEALTH: HealthData = {
  health: 100,
  armor: 0,
  stamina: 0,
  injuries: [],
};
