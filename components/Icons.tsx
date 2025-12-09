
import React from "react";

type IconProps = { className?: string; strokeWidth?: number };

const Icon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    className={className}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const HomeIcon = Icon;
export const CompassIcon = Icon;
export const UserIcon = Icon;
export const PlusIcon = Icon;
export const HeartIcon = Icon;
export const MessageCircleIcon = Icon;
export const SparklesIcon = Icon;
export const SendIcon = Icon;
export const CheckIcon = Icon;
export const ArrowLeftIcon = Icon;
export const WaveformIcon = Icon;
export const ImageIcon = Icon;
export const LogOutIcon = Icon;
export const GoogleIcon = Icon;
export const AppleIcon = Icon;
export const FlameIcon = Icon;
export const CalendarIcon = Icon;
export const LoaderIcon = Icon;
export const SettingsIcon = Icon;
export const BellIcon = Icon;
export const MoreHorizontalIcon = Icon;
export const XIcon = Icon;
