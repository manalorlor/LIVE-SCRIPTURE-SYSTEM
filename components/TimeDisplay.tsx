import React, { useState, useEffect } from 'react';

export const TimeDisplay: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end text-slate-300">
      <div className="font-heading font-bold text-xl md:text-2xl tracking-widest text-amber-500/90 leading-none">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs md:text-sm font-light uppercase tracking-wider opacity-60">
        {time.toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
};