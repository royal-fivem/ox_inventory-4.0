import React, { useEffect, useState } from 'react';
import useNuiEvent from '../../hooks/useNuiEvent';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';

interface CharacterData {
  name?: string;
  id?: string | number;
}

const CharacterInfo: React.FC = () => {
  const [data, setData] = useState<CharacterData>({});

  useNuiEvent<CharacterData>('setCharacterInfo', setData);

  useEffect(() => {
    if (isEnvBrowser()) return;

    fetchNui<CharacterData>('getCharacterInfo')
      .then((res) => res && setData(res))
      .catch(() => {});
  }, []);


  if (!data.name && data.id === undefined) return null;

  return (
    <div className="character-info">
      {data.name && <div className="character-info-name">{data.name}</div>}
      {data.id !== undefined && (
        <div className="character-info-id">
          <i className="fa-solid fa-id-card"></i>
          <span>{data.id}</span>
        </div>
      )}
    </div>
  );
};

export default CharacterInfo;
