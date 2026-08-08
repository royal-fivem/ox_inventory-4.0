import React from 'react';
import WeightBar from '../utils/WeightBar';
import { getItemUrl } from '../../helpers';
import { fetchNui } from '../../utils/fetchNui';
import { HealthData, Injury } from './types';
import { Locale } from '../../store/locale';

interface Props {
  data: HealthData;
}

const BAR_COLOR = 'rgb(162, 202, 49)';
const ARMOR_COLOR = 'rgb(0, 173, 255)';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const severityRgb = (severity: number): [number, number, number] => {
  if (severity >= 66) return [255, 45, 60]; // critical
  if (severity >= 33) return [255, 95, 70]; // major
  return [255, 150, 80]; // minor
};

const cornerBackground = (r: number, g: number, b: number) => {
  const line = `rgba(${r}, ${g}, ${b}, 0.9)`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.22)`;
  return `
    linear-gradient(to right, ${line}, transparent) top left / 16px 2px no-repeat,
    linear-gradient(to bottom, ${line}, transparent) top left / 2px 16px no-repeat,
    linear-gradient(to left, ${line}, transparent) top right / 16px 2px no-repeat,
    linear-gradient(to bottom, ${line}, transparent) top right / 2px 16px no-repeat,
    linear-gradient(to right, ${line}, transparent) bottom left / 16px 2px no-repeat,
    linear-gradient(to top, ${line}, transparent) bottom left / 2px 16px no-repeat,
    linear-gradient(to left, ${line}, transparent) bottom right / 16px 2px no-repeat,
    linear-gradient(to top, ${line}, transparent) bottom right / 2px 16px no-repeat,
    radial-gradient(circle at top left, ${glow}, transparent 12%) no-repeat,
    radial-gradient(circle at top right, ${glow}, transparent 12%) no-repeat,
    radial-gradient(circle at bottom left, ${glow}, transparent 12%) no-repeat,
    radial-gradient(circle at bottom right, ${glow}, transparent 12%) no-repeat
  `;
};

const severityLabel = (severity: number) => {
  if (severity >= 66) return Locale('ui_injury_critical', 'Critical Injury');
  if (severity >= 33) return Locale('ui_injury_major', 'Major Injury');
  return Locale('ui_injury_minor', 'Minor Injury');
};

// "left-arm" -> "LEFT ARM"
const formatPart = (part?: string) => (part ? part.replace(/[-_]+/g, ' ') : '');

const healInjury = (id: string) => {
  fetchNui('healInjury', { id }).catch(() => {
    /* no-op in browser / if the client callback isn't implemented */
  });
};

const SegmentedBar: React.FC<{ value: number; segments?: number; color: string }> = ({
  value,
  segments = 5,
  color,
}) => {
  const per = 100 / segments;

  return (
    <div className="health-segments">
      {Array.from({ length: segments }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, (value - i * per) / per)) * 100;

        return (
          <div key={i} className="weight-bar">
            <div
              style={{
                visibility: fill > 0 ? 'visible' : 'hidden',
                height: '100%',
                width: `${fill}%`,
                backgroundColor: color,
                transition: 'background 0.3s ease, width 0.25s ease',
                transitionDelay: `${i * 0.18}s`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

interface StatBarProps {
  label: string;
  value: number;
  segments?: number;
  color?: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, segments, color = BAR_COLOR }) => (
  <div className="health-stat">
    <div className="health-stat-head">
      <span className="health-stat-label">{label}</span>
      <span className="health-stat-value">{value}%</span>
    </div>
    {segments ? (
      <SegmentedBar value={value} segments={segments} color={color} />
    ) : (
      <WeightBar percent={value} rarityColor={color} />
    )}
  </div>
);

const HealthPage: React.FC<Props> = ({ data }) => {
  const health = clamp(data.health);
  const armor = clamp(data.armor);
  const stamina = clamp(data.stamina);
  const injuries: Injury[] = Array.isArray(data.injuries) ? data.injuries : [];

  return (
    <div className="health-page">
      <div className="health-panel">
        {/* -------- character status -------- */}
        <section className="health-section">
          <h2 className="health-section-title">{Locale('ui_character_status', 'Character Status')}</h2>
          <div className="health-stat-row">
            <StatBar label={Locale('ui_health', 'Health')} value={health} />
            <StatBar label={Locale('ui_armor', 'Armor')} value={armor} segments={5} color={ARMOR_COLOR} />
          </div>
        </section>

        {/* -------- physical form -------- */}
        <section className="health-section">
          <h2 className="health-section-title">{Locale('ui_physical_form', 'Physical Form')}</h2>
          <div className="health-stat">
            <div className="health-stat-head">
              <span className="health-stat-label">
                <i className="fa-solid fa-person-running" /> {Locale('ui_gym_stamina', 'Gym Stamina')}
              </span>
              <span className="health-stat-value">{stamina}%</span>
            </div>
            <WeightBar percent={stamina} rarityColor={BAR_COLOR} />
          </div>
        </section>

        {/* -------- injuries -------- */}
        <section className="health-section">
          <h2 className="health-section-title">{Locale('ui_injuries', 'Injuries')}</h2>
          {injuries.length === 0 ? (
            <p className="health-empty">{Locale('ui_no_injuries', 'You have no injuries!')}</p>
          ) : (
            <ul className="health-injuries">
              {injuries.map((injury) => {
                const [r, g, b] = severityRgb(injury.severity);

                return (
                <li
                  key={injury.id}
                  className="health-injury"
                  style={{
                    ['--sev' as any]: `rgb(${r}, ${g}, ${b})`,
                    // background intensity tracks severity
                    background: `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.3), rgba(${r}, ${g}, ${b}, 0.06) 55%, rgba(10, 8, 9, 0.25))`,
                  }}
                >
                  <span className="health-injury-corners" style={{ background: cornerBackground(r, g, b) }} />

                  <div className="health-injury-info">
                    <div className="health-injury-top">
                      {injury.bodyPart && (
                        <span className="health-injury-part">{formatPart(injury.bodyPart)}</span>
                      )}
                      <span className="health-injury-severity">{severityLabel(injury.severity)}</span>
                      {injury.bleeding && (
                        <span className="health-injury-bleeding">
                          <i className="fa-solid fa-droplet" /> {Locale('ui_bleeding', 'Bleeding')}
                        </span>
                      )}
                    </div>
                    <div className="health-injury-name">{injury.label}</div>
                  </div>

                  <div className="health-injury-heal">
                    <span className="health-injury-heal-label">{Locale('ui_heal_injury', 'Heal Injury')}</span>
                    <button
                      className="health-injury-heal-btn"
                      onClick={() => healInjury(injury.id)}
                      style={{ backgroundImage: `url(${getItemUrl(injury.healItem || 'bandage')})` }}
                      title={Locale('ui_heal_injury', 'Heal Injury')}
                    />
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default HealthPage;
