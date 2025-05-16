
import React, { ReactNode } from 'react';

interface SimpleCardProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
}

const SimpleCard = ({ children, title, actions, className = '' }: SimpleCardProps) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 animate-fade-in ${className}`}>
      {(title || actions) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-lg font-medium">{title}</h2>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default SimpleCard;
