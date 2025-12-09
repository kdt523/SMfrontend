import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const NeoCard = ({ children, className, title, action, ...props }) => {
  return (
    <div
      className={twMerge(
        'bg-white border-3 border-black shadow-neo p-6',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-4 border-b-3 border-black pb-2">
          {title && <h3 className="text-xl font-black uppercase">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default NeoCard;
