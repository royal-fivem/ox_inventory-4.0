import React from 'react';

// All experience icons use the shared placeholder image shipped with the
// c-experience resource. Referenced cross-resource via the nui:// scheme.
const PLACEHOLDER = 'nui://c-experience/images/placeholder.png';

interface Props {
  name?: string;
  className?: string;
}

const ExperienceIcon: React.FC<Props> = ({ className }) => (
  <img className={className} src={PLACEHOLDER} alt="" draggable={false} />
);

export default ExperienceIcon;
