import React, { useState, useEffect } from 'react';

const PLACEHOLDER = 'nui://royal-experience/images/placeholder.png';

interface Props {
  name?: string;
  className?: string;
}

const ExperienceIcon: React.FC<Props> = ({ className, name }) => {
  const initialSrc = name 
    ? `nui://royal-experience/images/${name}.png` 
    : PLACEHOLDER;

  const [imgSrc, setImgSrc] = useState<string>(initialSrc);

  useEffect(() => {
    setImgSrc(
      name ? `nui://royal-experience/images/${name}.png` : PLACEHOLDER
    );
  }, [name]);

  const handleError = () => {
    if (imgSrc !== PLACEHOLDER) {
      setImgSrc(PLACEHOLDER);
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