import { HealthData } from './types';

// Used when running the UI in the browser (npm run dev) so the page has
// something to render without the game client pushing data.
export const MOCK_HEALTH: HealthData = {
  health: 100,
  armor: 0,
  stamina: 0,
  // sample injuries so the skeleton shows coloured bones in the browser preview;
  injuries: [
    { id: '1', label: 'Fractured Arm', severity: 75, bodyPart: 'left-arm', bleeding: true },
    { id: '2', label: 'Bruised Leg', severity: 40, bodyPart: 'right-leg' },
    { id: '3', label: 'Concussion', severity: 20, bodyPart: 'head' },
  ],
};
