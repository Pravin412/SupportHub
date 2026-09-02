"use client";
import { MessageSquare } from "lucide-react";

type LoadingIndicatorProps = {
  themeColor?: string;
  className?: string;
};

export function LoadingIndicator({ themeColor = "#0f766e", className = "" }: LoadingIndicatorProps) {
  return (
    <div className={`relative flex h-16 w-16 items-center justify-center ${className}`}>
      {/* Background track */}
      <div 
        className="absolute inset-0 rounded-full border-[3px] border-current opacity-20"
        style={{ color: themeColor }}
      />
      {/* Spinning snake border */}
      <div 
        className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-current animate-spin"
        style={{ color: themeColor }}
      />
      {/* Static center icon */}
      <MessageSquare 
        size={24} 
        style={{ color: themeColor }}
      />
    </div>
  );
}
