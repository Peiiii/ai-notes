
import React from 'react';

const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a14.994 14.994 0 0 1-5.25 0M9.75 11.25c0-1.036.256-2.017.75-2.828A6.023 6.023 0 0 1 12 6.002c1.393 0 2.68.56 3.622 1.48A5.996 5.996 0 0 1 16.5 11.25m-6.75 0H12m4.5 0H12"
    />
  </svg>
);

export default LightbulbIcon;
