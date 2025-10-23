import React from 'react';

const PulseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M3.75 12h3l2.25 9L15 3l2.25 9h3" 
    />
  </svg>
);

export default PulseIcon;
