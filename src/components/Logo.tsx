
import React from 'react';

const Logo = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizeClasses = {
    small: 'text-lg',
    default: 'text-2xl',
    large: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-confectionery-pink flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-confectionery-peach flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-confectionery-purple"></div>
          </div>
        </div>
        <div className="absolute top-1 right-0 w-2 h-2 rounded-full bg-confectionery-green"></div>
      </div>
      <h1 className={`font-semibold ${sizeClasses[size]} gradient-text tracking-tight`}>
        AETHER
      </h1>
    </div>
  );
};

export default Logo;
