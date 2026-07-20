import React, { useEffect, useState } from 'react';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import useNuiEvent from '../../hooks/useNuiEvent';
import WeightBar from '../utils/WeightBar';
import { HealthData, Injury } from './types';
import { MOCK_HEALTH } from './mock';

interface Props {
  visible: boolean;
}

const BAR_COLOR = 'rgb(162, 202, 49)';
const ARMOR_COLOR = 'rgb(0, 173, 255)';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const severityColor = (severity: number) => {
  if (severity >= 66) return 'rgb(255, 0, 82)';
  if (severity >= 33) return 'rgb(255, 173, 0)';
  return 'rgb(162, 202, 49)';
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

const HealthPage: React.FC<Props> = ({ visible }) => {
  const [data, setData] = useState<HealthData>(MOCK_HEALTH);

  const load = () => {
    if (isEnvBrowser()) {
      setData(MOCK_HEALTH);
      return;
    }

    fetchNui<HealthData>('getHealthData')
      .then((res) => {
        if (res && typeof res === 'object') setData(res);
      })
      .catch(() => {
      });
  };

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  useNuiEvent<HealthData>('setHealthData', (res) => {
    if (res && typeof res === 'object') setData(res);
  });

  const health = clamp(data.health);
  const armor = clamp(data.armor);
  const stamina = clamp(data.stamina);
  const injuries: Injury[] = Array.isArray(data.injuries) ? data.injuries : [];

  return (
    <div className="health-page">
      <div className="health-panel">
        {/* -------- character status -------- */}
        <section className="health-section">
          <h2 className="health-section-title">Character Status</h2>
          <div className="health-stat-row">
            <StatBar label="Health" value={health} />
            <StatBar label="Armor" value={armor} segments={5} color={ARMOR_COLOR} />
          </div>
        </section>

        {/* -------- physical form -------- */}
        <section className="health-section">
          <h2 className="health-section-title">Physical Form</h2>
          <div className="health-stat">
            <div className="health-stat-head">
              <span className="health-stat-label">
                <i className="fa-solid fa-person-running" /> Gym Stamina
              </span>
              <span className="health-stat-value">{stamina}%</span>
            </div>
            <WeightBar percent={stamina} rarityColor={BAR_COLOR} />
          </div>
        </section>

        {/* -------- injuries -------- */}
        <section className="health-section">
          <h2 className="health-section-title">Injuries</h2>
          {injuries.length === 0 ? (
            <p className="health-empty">You have no injuries!</p>
          ) : (
            <ul className="health-injuries">
              {injuries.map((injury) => (
                <li key={injury.id} className="health-injury">
                  <span
                    className="health-injury-dot"
                    style={{ backgroundColor: severityColor(injury.severity) }}
                  />
                  <span className="health-injury-label">{injury.label}</span>
                  {injury.bodyPart && <span className="health-injury-part">{injury.bodyPart}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default HealthPage;
