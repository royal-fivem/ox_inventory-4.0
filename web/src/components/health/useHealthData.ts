import { useEffect, useState } from 'react';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import useNuiEvent from '../../hooks/useNuiEvent';
import { HealthData, Injury } from './types';
import { MOCK_HEALTH } from './mock';

const EMPTY_HEALTH: HealthData = { health: 100, armor: 0, stamina: 0, injuries: [] };
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const deriveLabel = (damage: number, bleeding: boolean): string => {
  if (bleeding) return 'Bleeding';
  if (damage >= 66) return 'Severe Wound';
  if (damage >= 33) return 'Wound';
  return 'Bruise';
};

const normalizeInjuries = (raw: any): Injury[] => {
  if (Array.isArray(raw)) return raw as Injury[];
  if (!raw || typeof raw !== 'object') return [];

  return Object.entries(raw).map(([bodyPart, value]: [string, any]) => {
    const damage = clamp(typeof value?.damage === 'number' ? value.damage : 0);
    const bleeding = !!value?.bleeding;

    return {
      id: bodyPart,
      bodyPart,
      severity: damage,
      bleeding,
      label: deriveLabel(damage, bleeding),
    };
  });
};

const normalize = (raw: any): HealthData => ({
  health: typeof raw?.health === 'number' ? raw.health : 100,
  armor: typeof raw?.armor === 'number' ? raw.armor : 0,
  stamina: typeof raw?.stamina === 'number' ? raw.stamina : 0,
  injuries: normalizeInjuries(raw?.injuries),
});

export const useHealthData = (active: boolean): HealthData => {
  const [data, setData] = useState<HealthData>(isEnvBrowser() ? MOCK_HEALTH : EMPTY_HEALTH);

  useEffect(() => {
    if (!active) return;

    if (isEnvBrowser()) {
      setData(MOCK_HEALTH);
      return;
    }

    fetchNui<HealthData>('getHealthData')
      .then((res) => {
        if (res && typeof res === 'object') setData(normalize(res));
      })
      .catch(() => {
        /* keep whatever we already have */
      });
  }, [active]);

  useNuiEvent<HealthData>('setHealthData', (res) => {
    if (res && typeof res === 'object') setData(normalize(res));
  });

  return data;
};
