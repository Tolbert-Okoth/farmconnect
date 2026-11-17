import React from 'react';

// A sprouting seed in a market basket: the FarmConnect mark
const BrandMark = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M4 15h24l-2.6 11.2A3 3 0 0 1 22.5 28.5h-13a3 3 0 0 1-2.9-2.3L4 15z" fill="#2a1d15" />
    <path d="M7 19h18M8 23h16" stroke="#f2b632" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M16 15c0-4 1.5-7.5 5.5-9.5-.2 4.4-2 7.6-5.5 9.5z" fill="#2f6b3a" />
    <path d="M16 15c0-3-1.4-5.6-4.8-7 .1 3.4 1.6 5.6 4.8 7z" fill="#5b9a52" />
  </svg>
);

export default BrandMark;
