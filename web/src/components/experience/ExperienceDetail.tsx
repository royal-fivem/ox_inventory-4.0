import React, { useMemo, useState } from 'react';
import ExperienceIcon from './ExperienceIcons';
import { getItemUrl } from '../../helpers';
import { isEnvBrowser } from '../../utils/misc';
import { Experience, ExperienceTrack } from './types';
import { Locale } from '../../store/locale';

// item images don't resolve in a browser (npm run dev), so use a hosted fallback
const ITEM_PLACEHOLDER =
  'https://static.vecteezy.com/system/resources/previews/056/434/838/non_2x/3d-white-question-mark-icon-png.png';

const rewardItemSrc = (name: string) => (getItemUrl(name) || ITEM_PLACEHOLDER);

interface Props {
  experience: Experience;
  onBack: () => void;
}

const ExperienceDetail: React.FC<Props> = ({ experience, onBack }) => {
  const [selectedId, setSelectedId] = useState(experience.id);

  const tracks: ExperienceTrack[] = useMemo(
    () => [experience, ...experience.subExperiences],
    [experience]
  );

  const selected = tracks.find((t) => t.id === selectedId) ?? experience;
  const pct = selected.nextXp > 0 ? Math.min(100, (selected.xp / selected.nextXp) * 100) : 100;

  return (
    <div className="xp-detail">
      <button className="xp-back" onClick={onBack}>
        <span className="xp-back-arrow">←</span> {Locale('ui_back', 'Back')}
      </button>

      <div className="xp-detail-header">
        <div className="xp-detail-icon">
          <ExperienceIcon name={selected.icon} />
        </div>

        <div className="xp-detail-heading">
          <h1>{selected.label}</h1>
          <span className="xp-detail-level">Level {selected.level}</span>
        </div>

        <div className="xp-detail-stats">
          <div className="xp-detail-daily">
            Daily <b>{selected.daily} / {selected.dailyCap}</b>
          </div>
          <div className="xp-detail-xp">
            {selected.xp} / <b>{selected.nextXp}</b>
          </div>
        </div>

        <div className="xp-detail-bar">
          <div className="xp-detail-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="xp-detail-body">
        <div className="xp-track-list">
          <button
            className={`xp-track-item main ${selectedId === experience.id ? 'active' : ''}`}
            onClick={() => setSelectedId(experience.id)}
          >
            <span className="xp-track-icon">
              <ExperienceIcon name={experience.icon} />
            </span>
            <span className="xp-track-label">{experience.label}</span>
            <span className="xp-track-lvl">{Locale('ui_lvl', 'Lvl')} {experience.level}</span>
          </button>

          {experience.subExperiences.length > 0 && (
            <>
              <div className="xp-track-section">{Locale('ui_sub_experiences', 'Sub-Experiences')}</div>
              {experience.subExperiences.map((sub) => (
                <button
                  key={sub.id}
                  className={`xp-track-item ${selectedId === sub.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(sub.id)}
                >
                  <span className="xp-track-icon">
                    <ExperienceIcon name={sub.icon} />
                  </span>
                  <span className="xp-track-label">{sub.label}</span>
                  <span className="xp-track-lvl">{Locale('ui_lvl', 'Lvl')} {sub.level}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="xp-unlocks">
          <div className="xp-unlocks-title">{Locale('ui_unlocks', 'Unlocks')}</div>
          <div className="xp-unlocks-list">
            {selected.unlocks.map((unlock) => {
              const reached = unlock.level <= selected.level;
              return (
                <div className={`xp-unlock-row ${reached ? 'reached' : ''}`} key={unlock.level}>
                  <span className="xp-unlock-marker" />
                  <span className="xp-unlock-level">{Locale('ui_level', 'Level')} {unlock.level}</span>
                  <div className="xp-unlock-text">
                    <span className="xp-unlock-name">{unlock.title}</span>
                    {unlock.bonus && <span className="xp-unlock-bonus">{unlock.bonus}</span>}
                  </div>
                  {(unlock.reward !== undefined || (unlock.items && unlock.items.length > 0)) && (
                    <div className="xp-unlock-rewards">
                      {unlock.reward !== undefined && (
                        <span className="xp-unlock-reward">$ {unlock.reward.toLocaleString('en-us')}</span>
                      )}

                      {unlock.items?.map((item, i) => {
                        const count = item.count ?? 1;
                        return (
                          <div
                            className="xp-reward-item"
                            key={`${item.name}-${i}`}
                            title={item.label ?? item.name}
                          >
                            <img
                              src={rewardItemSrc(item.name)}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = ITEM_PLACEHOLDER;
                              }}
                              draggable={false}
                            />
                            {count > 1 && <span className="xp-reward-count">{count}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceDetail;
