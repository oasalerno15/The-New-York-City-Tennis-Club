"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName
}: GooeyTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);

  React.useEffect(() => {
    // Start cycling immediately - no initial delay
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, (morphTime + cooldownTime) * 1000); // Convert to milliseconds

    return () => clearInterval(interval);
  }, [texts, morphTime, cooldownTime]);

  const currentText = texts[currentTextIndex];

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-center">
        <span
          className={cn(
            "inline-block select-none text-center text-6xl md:text-[60pt]",
            "text-foreground",
            textClassName
          )}
        >
          {currentText}
        </span>
      </div>
    </div>
  );
} 