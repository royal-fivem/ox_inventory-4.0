import { useEffect, useState } from 'react';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import useNuiEvent from '../../hooks/useNuiEvent';
import { HealthData } from './types';
import { MOCK_HEALTH } from './mock';

const EMPTY_HEALTH: HealthData = { health: 100, armor: 0, stamina: 0, injuries: [] };

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
        if (res && typeof res === 'object') setData(res);
      })
      .catch(() => {
        /* keep whatever we already have */
      });
  }, [active]);

  useNuiEvent<HealthData>('setHealthData', (res) => {
    if (res && typeof res === 'object') setData(res);
  });

  return data;
};
