
import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: 'pink' | 'peach' | 'yellow' | 'green' | 'blue' | 'purple';
}

const StatCard = ({ title, value, subtitle, icon, color = 'pink' }: StatCardProps) => {
  const colorClasses = {
    pink: 'bg-confectionery-pink/50',
    peach: 'bg-confectionery-peach/50',
    yellow: 'bg-confectionery-yellow/50',
    green: 'bg-confectionery-green/50',
    blue: 'bg-confectionery-blue/50',
    purple: 'bg-confectionery-purple/50',
  };

  return (
    <div className={`rounded-xl p-5 ${colorClasses[color]} border border-confectionery-${color}/20 card-hover animate-scale-in`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className={`p-2 rounded-lg bg-confectionery-${color}`}>{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
