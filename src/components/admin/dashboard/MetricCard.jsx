import React from 'react';

const MetricCard = ({ title, value, icon, colorClass }) => {
  return (
    <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorClass} shadow-lg text-white overflow-hidden`}>
      <div className="relative z-10 flex items-center gap-6">
        <div className="p-3 bg-white/20 rounded-xl">
          {icon}
        </div>
        <div>
          <h3 className="text-3xl font-extrabold">{value}</h3>
          <p className="text-sm font-medium opacity-80">{title}</p>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 opacity-20">
        {React.cloneElement(icon, { className: 'w-24 h-24' })}
      </div>
    </div>
  );
};

export default MetricCard; 