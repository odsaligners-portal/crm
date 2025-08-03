import React, { useEffect, useState } from 'react';
import CountUp from 'react-countup';

const MetricCard = ({ title, value, icon, colorClass }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Ensure value is always a valid number for CountUp
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`group relative transform transition-all duration-700 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } hover:scale-105 hover:-translate-y-2`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-br ${colorClass} rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500`}></div>
      
      {/* Main card */}
      <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${colorClass} shadow-2xl text-white overflow-hidden border border-white/20`}>
        
        {/* Animated background patterns */}
        <div className="absolute inset-0">
          {/* Primary shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 ease-out"></div>
          
          {/* Floating orbs */}
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-md animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/5 rounded-full blur-lg animate-pulse animation-delay-1000"></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>
        </div>

        {/* Content container */}
        <div className="relative z-10 flex items-center gap-8">
          
          {/* Enhanced icon container */}
          <div className="relative group/icon">
            {/* Icon glow effect */}
            <div className="absolute inset-0 bg-white/30 rounded-2xl blur-md scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            {/* Main icon background */}
            <div className={`relative p-4 bg-white/25 backdrop-blur-sm rounded-2xl border border-white/30 
                          transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6
                          ${isHovered ? 'shadow-2xl shadow-white/20' : 'shadow-lg shadow-black/10'}`}>
              <div className="relative z-10 transform transition-transform duration-300 group-hover/icon:scale-110">
                {React.cloneElement(icon, { 
                  className: 'w-8 h-8 drop-shadow-lg',
                  style: { filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }
                })}
              </div>
              
              {/* Icon pulse effect */}
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping opacity-0 group-hover:opacity-30"></div>
            </div>
          </div>
          
          {/* Enhanced text content */}
          <div className="flex-1">
            {/* Counter with enhanced styling */}
            <div className="mb-2">
              <h3 className="text-4xl font-black flex items-end gap-2 leading-none">
                <span className={`inline-block animate-countup-premium relative ${
                  isHovered ? 'animate-bounce-subtle' : ''
                }`}>
                  <CountUp
                    end={numericValue}
                    duration={4}
                    separator="," 
                    decimals={0}
                    useEasing
                    enableScrollSpy
                    scrollSpyOnce
                  />
                  {/* Number glow effect */}
                  <div className="absolute inset-0 text-4xl font-black text-white/50 blur-sm -z-10">
                    <CountUp
                      end={numericValue}
                      duration={4}
                      separator="," 
                      decimals={0}
                      useEasing
                      enableScrollSpy
                      scrollSpyOnce
                    />
                  </div>
                </span>
                
                {/* Trending indicator */}
                <div className="flex items-center ml-2 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-1 h-4 bg-white/60 rounded-full ml-1"></div>
                  <div className="w-1 h-3 bg-white/40 rounded-full ml-1"></div>
                </div>
              </h3>
            </div>
            
            
            <p className="text-[10px] font-semibold opacity-90 tracking-wide uppercase leading-tight transform transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
              {title}
            </p> 
            
            {/* Animated underline */}
            <div className="mt-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div className={`h-full bg-white rounded-full transform transition-all duration-700 ease-out ${
                isVisible ? 'translate-x-0 w-full' : '-translate-x-full w-0'
              }`} style={{ transitionDelay: '800ms' }}></div>
            </div>
          </div>
        </div>

        {/* Enhanced background icon */}
        <div className="absolute -bottom-8 -right-8 opacity-10 transform transition-all duration-700 group-hover:opacity-20 group-hover:scale-110 group-hover:rotate-12">
          {React.cloneElement(icon, { 
            className: 'w-28 h-28',
            style: { filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' }
          })}
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
        
        {/* Premium border highlight */}
        <div className="absolute inset-0 rounded-3xl border border-white/30 pointer-events-none"></div>
        <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none transform scale-105"></div>
        
        {/* Corner accents */}
        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/40 rounded-tl-lg"></div>
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/40 rounded-br-lg"></div>
      </div>
      
      <style jsx>{`
        @keyframes countup-premium {
          0% { 
            transform: scale(0.8) rotateY(-15deg); 
            color: rgba(255,255,255,0.6);
            text-shadow: 0 0 20px rgba(255,255,255,0.5);
          }
          30% { 
            transform: scale(1.08) rotateY(5deg); 
            color: rgba(255,255,255,0.9);
            text-shadow: 0 0 30px rgba(255,255,255,0.8);
          }
          60% {
            transform: scale(0.98) rotateY(-2deg);
            color: rgba(255,255,255,0.95);
            text-shadow: 0 0 25px rgba(255,255,255,0.6);
          }
          100% { 
            transform: scale(1) rotateY(0deg); 
            color: #fff;
            text-shadow: 0 0 15px rgba(255,255,255,0.4);
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        .animate-countup-premium {
          animation: countup-premium 3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: inline-block;
          transform-style: preserve-3d;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .group:hover .animate-shimmer {
          animation: shimmer 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MetricCard;