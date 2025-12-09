import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const NeoButton = ({ children, className, variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-neo-main hover:bg-yellow-300 text-black',
    secondary: 'bg-neo-blue hover:bg-cyan-300 text-black',
    accent: 'bg-neo-accent hover:bg-red-400 text-white',
    outline: 'bg-white hover:bg-gray-100 text-black',
    ghost: 'bg-transparent shadow-none border-none hover:bg-gray-100',
  };

  return (
    <button
      className={twMerge(
        'px-6 py-2 font-bold border-3 border-black shadow-neo active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeoButton;
