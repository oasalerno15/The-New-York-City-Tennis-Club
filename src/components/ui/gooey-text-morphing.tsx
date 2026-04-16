"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    <div className={cn("relative min-h-[1.2em]", className)}>
      <div className="flex min-h-[inherit] items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentTextIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "inline-block select-none text-center text-6xl md:text-[60pt]",
              "text-foreground",
              textClassName
            )}
          >
            {currentText}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
} 