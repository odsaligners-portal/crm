import React, { useEffect, useState } from "react";
import CountUp from "react-countup";

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
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } hover:-translate-y-2 hover:scale-105`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer glow effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${colorClass} rounded-3xl opacity-30 blur-xl transition-opacity duration-500 group-hover:opacity-60`}
      ></div>

      {/* Main card */}
      <div
        className={`relative rounded-3xl bg-gradient-to-br p-8 ${colorClass} overflow-hidden border border-white/20 text-white shadow-2xl`}
      >
        {/* Animated background patterns */}
        <div className="absolute inset-0">
          {/* Primary shimmer effect */}
          <div className="absolute inset-0 translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[-200%]"></div>

          {/* Floating orbs */}
          <div className="absolute top-2 right-2 h-16 w-16 animate-pulse rounded-full bg-white/10 blur-md"></div>
          <div className="animation-delay-1000 absolute bottom-4 left-4 h-12 w-12 animate-pulse rounded-full bg-white/5 blur-lg"></div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>
        </div>

        {/* Content container */}
        <div className="relative z-10 flex items-center gap-8">
          {/* Enhanced icon container */}
          <div className="group/icon relative">
            {/* Icon glow effect */}
            <div className="absolute inset-0 scale-110 rounded-2xl bg-white/30 opacity-0 blur-md transition-all duration-500 group-hover:opacity-100"></div>

            {/* Main icon background */}
            <div
              className={`relative transform rounded-2xl border border-white/30 bg-white/25 p-4 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${isHovered ? "shadow-2xl shadow-white/20" : "shadow-lg shadow-black/10"}`}
            >
              <div className="relative z-10 transform transition-transform duration-300 group-hover/icon:scale-110">
                {React.cloneElement(icon, {
                  className: "w-8 h-8 drop-shadow-lg",
                  style: {
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
                  },
                })}
              </div>

              {/* Icon pulse effect */}
              <div className="absolute inset-0 animate-ping rounded-2xl bg-white/20 opacity-0 group-hover:opacity-30"></div>
            </div>
          </div>

          {/* Enhanced text content */}
          <div className="flex-1">
            {/* Counter with enhanced styling */}
            <div className="mb-2">
              <h3 className="flex items-end gap-2 text-4xl leading-none font-black">
                <span
                  className={`animate-countup-premium relative inline-block ${
                    isHovered ? "animate-bounce-subtle" : ""
                  }`}
                >
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
                  <div className="absolute inset-0 -z-10 text-4xl font-black text-white/50 blur-sm">
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
                <div className="ml-2 flex animate-pulse items-center">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <div className="ml-1 h-4 w-1 rounded-full bg-white/60"></div>
                  <div className="ml-1 h-3 w-1 rounded-full bg-white/40"></div>
                </div>
              </h3>
            </div>

            <p className="transform text-[10px] leading-tight font-semibold tracking-wide uppercase subpixel-antialiased opacity-90 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
              {title}
            </p>

            {/* Animated underline */}
            <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/30">
              <div
                className={`h-full transform rounded-full bg-white transition-all duration-700 ease-out ${
                  isVisible ? "w-full translate-x-0" : "w-0 -translate-x-full"
                }`}
                style={{ transitionDelay: "800ms" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Enhanced background icon */}
        <div className="absolute -right-8 -bottom-8 transform opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-20">
          {React.cloneElement(icon, {
            className: "w-28 h-28",
            style: { filter: "drop-shadow(0 0 20px rgba(255,255,255,0.2))" },
          })}
        </div>

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 animate-ping rounded-full bg-white/40"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Premium border highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/30"></div>
        <div className="pointer-events-none absolute inset-0 scale-105 transform rounded-3xl border border-white/10"></div>

        {/* Corner accents */}
        <div className="absolute top-3 left-3 h-6 w-6 rounded-tl-lg border-t-2 border-l-2 border-white/40"></div>
        <div className="absolute right-3 bottom-3 h-6 w-6 rounded-br-lg border-r-2 border-b-2 border-white/40"></div>
      </div>

      <style jsx>{`
        @keyframes countup-premium {
          0% {
            transform: scale(0.8) rotateY(-15deg);
            color: rgba(255, 255, 255, 0.6);
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
          30% {
            transform: scale(1.08) rotateY(5deg);
            color: rgba(255, 255, 255, 0.9);
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
          }
          60% {
            transform: scale(0.98) rotateY(-2deg);
            color: rgba(255, 255, 255, 0.95);
            text-shadow: 0 0 25px rgba(255, 255, 255, 0.6);
          }
          100% {
            transform: scale(1) rotateY(0deg);
            color: #fff;
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
          }
        }

        @keyframes bounce-subtle {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
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
