import React from 'react';

const MindMapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.5a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 10.5h4.5a2.25 2.25 0 0 1 2.25 2.25V15a2.25 2.25 0 0 0 2.25 2.25h2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 10.5v-3a2.25 2.25 0 0 1 2.25-2.25h4.5" />
  </svg>
);
export default MindMapIcon;