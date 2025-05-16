
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
    <SimpleCard title={title} actions={actions} className={`h-80 ${className}`}>
      <div className="h-64">
        {children}
      </div>
    </SimpleCard>
  );
};

export default ChartCard;
