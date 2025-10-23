import React from 'react';

const ThoughtBubbleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72.372a11.25 11.25 0 0 1-5.58 0l-3.72-.372A2.25 2.25 0 0 1 3.75 15.118V10.608c0-.97.616-1.813 1.5-2.097m14.25-1.125a2.25 2.25 0 0 0-2.25-2.25H7.5a2.25 2.25 0 0 0-2.25 2.25v.442c.884-.285 1.83-.442 2.813-.442h7.037a3.375 3.375 0 0 1 2.813.442v-.442Z" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M12 8.25l.66 1.625 1.625.66-1.625.66L12 12.83l-.66-1.625-1.625-.66 1.625-.66L12 8.25Z" 
    />
  </svg>
);

export default ThoughtBubbleIcon;
