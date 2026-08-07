import React, { useEffect, useState } from 'react';
import useNuiEvent from '../../hooks/useNuiEvent';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';

interface CharacterData {
  name?: string;
  id?: string | number;
}

let cachedInfo: CharacterData | null = null;
const hasInfo = (i?: CharacterData | null) => !!i && (!!i.name || i.id !== undefined);

const CharacterInfo: React.FC = () => {
  const [data, setData] = useState<CharacterData>(cachedInfo ?? {});

  useNuiEvent<CharacterData>('setCharacterInfo', (res) => {
    cachedInfo = res;
    setData(res);
  });


  useEffect(() => {
    if (isEnvBrowser() || hasInfo(cachedInfo)) return;

    fetchNui<CharacterData>('getCharacterInfo')
      .then((res) => {
        if (!hasInfo(res)) return;
        cachedInfo = res;
        setData(res);
      })
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
