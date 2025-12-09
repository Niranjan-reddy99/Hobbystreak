
import React from "react";

/* 
  Generic placeholder icon used for any missing icons.
  This prevents Rollup/Vite from crashing even if 
  the actual icon hasn't been implemented yet.
*/
const Placeholder = ({ className = "" }: any) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" />
    <line x1="7" y1="7" x2="17" y2="17" />
  </svg>
);

/*
  List of ALL icons your App.tsx imports.
  They all export a working placeholder.
*/
export const HomeIcon = Placeholder;
export const CompassIcon = Placeholder;
export const UserIcon = Placeholder;
export const PlusIcon = Placeholder;
export const HeartIcon = Placeholder;
export const MessageCircleIcon = Placeholder;
export const SparklesIcon = Placeholder;
export const SendIcon = Placeholder;
export const CheckIcon = Placeholder;
export const ArrowLeftIcon = Placeholder;
export const MicIcon = Placeholder;
export const PhoneIcon = Placeholder;
export const XIcon = Placeholder;
export const WaveformIcon = Placeholder;
export const ImageIcon = Placeholder;
export const LogOutIcon = Placeholder;
export const GoogleIcon = Placeholder;
export const AppleIcon = Placeholder;
export const LockIcon = Placeholder;
export const GlobeIcon = Placeholder;
export const SearchIcon = Placeholder;
export const UsersIcon = Placeholder;
export const TrophyIcon = Placeholder;
export const FlameIcon = Placeholder;
export const AwardIcon = Placeholder;
export const StarIcon = Placeholder;
export const ClockIcon = Placeholder;
export const CalendarIcon = Placeholder;
export const TrashIcon = Placeholder;
export const LightningIcon = Placeholder;
export const LoaderIcon = Placeholder;
export const SettingsIcon = Placeholder;
export const BellIcon = Placeholder;
export const ShieldIcon = Placeholder;
export const HelpCircleIcon = Placeholder;
export const ChevronRightIcon = Placeholder;
export const MoreHorizontalIcon = Placeholder;
export const FlagIcon = Placeholder;

export default {
  HomeIcon,
  CompassIcon,
  UserIcon,
  PlusIcon,
  HeartIcon,
  MessageCircleIcon,
  SparklesIcon,
  SendIcon,
  CheckIcon,
  ArrowLeftIcon,
  MicIcon,
  PhoneIcon,
  XIcon,
  WaveformIcon,
  ImageIcon,
  LogOutIcon,
  GoogleIcon,
  AppleIcon,
  LockIcon,
  GlobeIcon,
  SearchIcon,
  UsersIcon,
  TrophyIcon,
  FlameIcon,
  AwardIcon,
  StarIcon,
  ClockIcon,
  CalendarIcon,
  TrashIcon,
  LightningIcon,
  LoaderIcon,
  SettingsIcon,
  BellIcon,
  ShieldIcon,
  HelpCircleIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  FlagIcon,
};

