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
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 100 100"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle magnifying glass */}
      <circle
        cx="35"
        cy="35"
        fill="none"
        r="20"
        stroke="url(#gradient1)"
        strokeWidth="3"
      />

      {/* Chart line inside magnifying glass */}
      <path
        d="M25 40 L30 35 L35 38 L40 30"
        fill="none"
        stroke="url(#gradient2)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />

      {/* Magnifying glass handle */}
      <path
        d="M48 48 L70 70"
        stroke="url(#gradient3)"
        strokeLinecap="round"
        strokeWidth="4"
      />

      {/* Handle grip ellipse */}
      <ellipse
        cx="65"
        cy="75"
        fill="none"
        rx="8"
        ry="4"
        stroke="url(#gradient3)"
        strokeWidth="2.5"
        transform="rotate(45 65 75)"
      />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="gradient1" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="gradient3" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
};
