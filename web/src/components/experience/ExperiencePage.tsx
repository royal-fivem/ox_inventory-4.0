import React, { useEffect, useState } from 'react';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import useNuiEvent from '../../hooks/useNuiEvent';
import ExperienceCard from './ExperienceCard';
import ExperienceDetail from './ExperienceDetail';
import { Experience } from './types';
import { MOCK_EXPERIENCE } from './mock';

interface Props {
  visible: boolean;
}

const ExperiencePage: React.FC<Props> = ({ visible }) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () => {
    if (isEnvBrowser()) {
      setExperiences(MOCK_EXPERIENCE);
      return;
    }

    fetchNui<Experience[]>('getExperience')
      .then((data) => {
        if (Array.isArray(data) && data.length) setExperiences(data);
      })
      .catch(() => {
        /* keep whatever we already have */
      });
  };

  // fetch whenever the page becomes visible so it stays fresh
  useEffect(() => {
    if (visible) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // live updates pushed from c-experience when XP changes
  useNuiEvent<Experience[]>('setExperience', (data) => {
    if (Array.isArray(data)) setExperiences(data);
  });

  const openExperience = openId ? experiences.find((e) => e.id === openId) ?? null : null;

  return (
    <div className="xp-page">
      <div className="xp-page-header">
        <h1>Experience</h1>
        <p>Your progression across every discipline</p>
      </div>

      {openExperience ? (
        <ExperienceDetail experience={openExperience} onBack={() => setOpenId(null)} />
      ) : (
        <div className="xp-grid">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} onOpen={setOpenId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperiencePage;
