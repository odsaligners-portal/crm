import React from 'react';
import CountUp from 'react-countup';

const MetricCard = ({ title, value, icon, colorClass }) => {
  return (
    <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorClass} shadow-lg text-white overflow-hidden`}>
      <div className="relative z-10 flex items-center gap-6">
        <div className="p-3 bg-white/20 rounded-xl">
          {icon}
        </div>
        <div>
          <h3 className="text-3xl font-extrabold flex items-end gap-2">
            <span className="inline-block animate-countup-pop">
              <CountUp
                end={typeof value === 'number' ? value : value || 0}
                duration={1.4}
                separator="," 
                decimals={value && value.toString().includes('.') ? 2 : 0}
                useEasing
                enableScrollSpy
                scrollSpyOnce
              />
            </span>
          </h3>
          <p className="text-sm font-medium opacity-80">{title}</p>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 opacity-20">
        {React.cloneElement(icon, { className: 'w-24 h-24' })}
      </div>
      <style jsx>{`
        @keyframes countup-pop {
          0% { transform: scale(0.8); color: #fff7b2; filter: blur(2px); }
          60% { transform: scale(1.15); color: #fffde4; filter: blur(0); }
          100% { transform: scale(1); color: #fff; filter: blur(0); }
        }
        .animate-countup-pop {
          animation: countup-pop 1.2s cubic-bezier(0.23, 1, 0.32, 1);
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default MetricCard; 