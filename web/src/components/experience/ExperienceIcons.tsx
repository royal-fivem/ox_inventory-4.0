import React, { useState, useEffect } from 'react';
import { isEnvBrowser } from '../../utils/misc';

const PLACEHOLDER = 'nui://royal-experience/images/placeholder.png';
const BROWSER_IMAGE =
  'https://static.vecteezy.com/system/resources/previews/056/434/838/non_2x/3d-white-question-mark-icon-png.png';

const iconSrc = (name?: string) => {
  if (isEnvBrowser()) return BROWSER_IMAGE;
  return name ? `nui://royal-experience/images/${name}.png` : PLACEHOLDER;
};

interface Props {
  name?: string;
  className?: string;
}

const ExperienceIcon: React.FC<Props> = ({ className, name }) => {
  const [imgSrc, setImgSrc] = useState<string>(() => iconSrc(name));

  useEffect(() => {
    setImgSrc(iconSrc(name));
  }, [name]);

  const handleError = () => {
    const fallback = isEnvBrowser() ? BROWSER_IMAGE : PLACEHOLDER;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <img
      className={className}
      src={imgSrc}
      onError={handleError}
      draggable={false}
    />
  );
};

export default ExperienceIcon;