
import React from 'react';

const ArrowPathRoundedSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}>
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M16.425 9.75 17.5 12l-1.075 2.25m-3.85-4.5-1.075 2.25L12.5 12l-1.075-2.25M9.3 9.75 8.225 12l1.075 2.25m3.85-4.5-1.075 2.25L11.5 12l1.075 2.25m0-4.5-1.075 2.25m-3.85 4.5-1.075-2.25M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-3 1.5V12m0 0H9m1.5 0H12m0 0V9m1.5 1.5V12m0 0h1.5m-1.5 0H12" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" 
    />
  </svg>
);

export default ArrowPathRoundedSquareIcon;
