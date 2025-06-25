import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 z-[9999] flex items-center justify-center w-full h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        {/* Pulsating background circles */}
        <span className="absolute w-32 h-32 rounded-full bg-brand-500/20 animate-ping"></span>
        <span className="absolute w-24 h-24 rounded-full bg-brand-500/30 animate-ping [animation-delay:0.2s]"></span>
        
        {/* Logo */}
        <div className="z-10 p-4 bg-white rounded-full shadow-lg dark:bg-gray-800">
            <Image
                src="/logo.png"
                alt="Loading..."
                width={64}
                height={64}
                priority
            />
        </div>
      </div>
    </div>
  );
} 