
import React from 'react';

const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M5.25 8.25h13.5m-13.5 0a2.25 2.25 0 0 1-2.25-2.25V5.25c0-1.242 1.008-2.25 2.25-2.25h13.5c1.242 0 2.25 1.008 2.25 2.25v.75a2.25 2.25 0 0 1-2.25 2.25m-13.5 0V21a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V8.25" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M7.5 12.75h9"
    />
  </svg>
);

export default BeakerIcon;
