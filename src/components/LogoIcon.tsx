import React from "react";

interface LogoIconProps {
  size?: number;
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 24,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle magnifying glass */}
      <circle
        cx="35"
        cy="35"
        r="20"
        stroke="url(#gradient1)"
        strokeWidth="3"
        fill="none"
      />

      {/* Chart line inside magnifying glass */}
      <path
        d="M25 40 L30 35 L35 38 L40 30"
        stroke="url(#gradient2)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Magnifying glass handle */}
      <path
        d="M48 48 L70 70"
        stroke="url(#gradient3)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Handle grip ellipse */}
      <ellipse
        cx="65"
        cy="75"
        rx="8"
        ry="4"
        stroke="url(#gradient3)"
        strokeWidth="2.5"
        fill="none"
        transform="rotate(45 65 75)"
      />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
};
