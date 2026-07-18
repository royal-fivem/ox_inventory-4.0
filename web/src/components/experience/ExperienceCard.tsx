import React from 'react';
import ExperienceIcon from './ExperienceIcons';
import { Experience } from './types';

interface Props {
  experience: Experience;
  onOpen: (id: string) => void;
}

const ExperienceCard: React.FC<Props> = ({ experience, onOpen }) => {
  const pct = experience.nextXp > 0 ? Math.min(100, (experience.xp / experience.nextXp) * 100) : 100;

  return (
    <button className="xp-card" onClick={() => onOpen(experience.id)}>
      <div className="xp-card-icon">
        <ExperienceIcon name={experience.icon} />
      </div>

      <div className="xp-card-body">
        <div className="xp-card-name">{experience.label}</div>

        <div className="xp-card-progress">
          <div className="xp-card-progress-head">
            <span className="xp-card-level">Level {experience.level}</span>
            <span className="xp-card-xp">
              {experience.xp} / {experience.nextXp}
            </span>
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
};

export default ExperienceCard;
