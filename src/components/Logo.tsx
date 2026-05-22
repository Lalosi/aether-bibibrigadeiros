
import React from 'react';
import { config } from '@/lib/config';

const Logo = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizeClasses = {
    small: 'h-6',
    default: 'h-8',
    large: 'h-12',
  };

  return (
    <div className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/73d11f78-9223-4e00-bb4a-cc631802c552.png" 
        alt={`${config.appName} Logo`}
        className={`${sizeClasses[size]}`} 
      />
    </div>
  );
};

export default Logo;
