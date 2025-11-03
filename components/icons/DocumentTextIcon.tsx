import React from 'react';

const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3h7.5M3 17.25h1.5a.75.75 0 0 0 0-1.5H3v1.5Zm0-4.5h1.5a.75.75 0 0 0 0-1.5H3v1.5Zm0-4.5h1.5a.75.75 0 0 0 0-1.5H3v1.5Z" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M21 8.25v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V5.25a2.25 2.25 0 0 1 2.25-2.25h10.5a2.25 2.25 0 0 1 2.25 2.25v.75" 
    />
  </svg>
);

export default DocumentTextIcon;