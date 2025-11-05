
import React from 'react';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M10.5 21l5.25-11.25L21 21m-9-3.75h.008v.008H12v-.008ZM8.25 9.75A2.625 2.625 0 1 1 3 9.75a2.625 2.625 0 0 1 5.25 0ZM15.75 9.75a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" 
    />
  </svg>
);

export default SparklesIcon;
