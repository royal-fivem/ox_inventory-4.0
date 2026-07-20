import React from 'react';
import BodyFigure from './BodyFigure';
import { Injury } from './types';

interface Props {
  injuries?: Injury[];
}

const HealthFigure: React.FC<Props> = ({ injuries }) => (
  <div
    className="utils-inventory"
    style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '64vh', height: '60vh' }}
  >
    <div className="utils-center">
      <div
        style={{ width: '26vh', height: '48vh', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}
      >
        <BodyFigure injuries={injuries} />
      </div>
    </div>
  </div>
);

export default HealthFigure;
