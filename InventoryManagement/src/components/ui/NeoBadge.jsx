import React from 'react';
import { twMerge } from 'tailwind-merge';

const NeoBadge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-gray-200 text-black',
    success: 'bg-neo-green text-black',
    warning: 'bg-neo-main text-black',
    danger: 'bg-neo-accent text-white',
    info: 'bg-neo-blue text-black',
  };

  return (
    <span
      className={twMerge(
        'px-3 py-1 text-xs font-bold border-2 border-black shadow-neo-sm uppercase inline-block',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default NeoBadge;
