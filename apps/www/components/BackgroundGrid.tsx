import React from 'react';

export const BackgroundGrid: React.FC = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none opacity-40"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage:
          'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage:
          'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }}
    />
  );
};
