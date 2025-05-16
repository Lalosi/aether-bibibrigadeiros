
import React, { ReactNode } from 'react';
import SimpleCard from './SimpleCard';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const ChartCard = ({ title, children, actions, className = '' }: ChartCardProps) => {
  return (
    <SimpleCard title={title} actions={actions} className={`h-auto md:h-80 ${className} animate-fade-in`}>
      <div className="h-48 md:h-64 animate-float">
        {children}
      </div>
    </SimpleCard>
  );
};

export default ChartCard;
