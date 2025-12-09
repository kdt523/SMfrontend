import React from 'react';
import { twMerge } from 'tailwind-merge';

const NeoInput = ({ label, className, error, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="font-bold text-sm uppercase">{label}</label>}
      <input
        className={twMerge(
          'w-full px-4 py-2 border-3 border-black shadow-neo-sm focus:shadow-neo focus:outline-none transition-all bg-white',
          error ? 'border-neo-accent' : '',
          className
        )}
        {...props}
      />
      {error && <span className="text-neo-accent text-xs font-bold">{error}</span>}
    </div>
  );
};

export default NeoInput;
