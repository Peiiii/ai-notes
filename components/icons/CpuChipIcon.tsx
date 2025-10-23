
import React from 'react';

const CpuChipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5m7.5-18v1.5m0 16.5v-1.5M12 5.25v13.5m-3.75-13.5v13.5m7.5-13.5v13.5M9 5.25h6M9 18.75h6" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M21 8.25V15.75a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15.75V8.25a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 8.25Z" 
    />
  </svg>
);

export default CpuChipIcon;
