'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QA_ITEMS = [
  {
    question: 'What is the official tennis season?',
    answer:
      "The official NYC tennis season runs from the first Saturday of April through the Sunday before Thanksgiving. Most outdoor public courts require a valid NYC Parks tennis permit during this time.",
  },
  {
    question: 'What types of permits are available?',
    answer:
      "There are several types: Full-Season Permit (best for frequent players, valid the entire season), Single-Play Permit (one-day use for occasional play - $15), Senior Permit (discounted rate for seniors 65+), and Student Permit (discounted rate for students with valid ID).",
  },
  {
    question: 'Where can I get a tennis permit?',
    answer:
      "You can get permits at NYC Parks Tennis Permit Offices in all five boroughs: Bronx (1 Bronx River Parkway, Bronx, NY 10462), Brooklyn (95 Prospect Park West, between 4th & 5th Streets, Brooklyn, NY 11215), Manhattan (830 5th Avenue, The Arsenal, Room 1 Basement, New York, NY 10065), Queens (Passerelle Building, across from outdoor tennis courts, Flushing Meadows–Corona Park, Queens, NY 11368), or Paragon Sports (867 Broadway & 18th Street, New York, NY 10003). All offices are open Monday–Friday, 9 AM–4 PM, except Paragon which is open Monday–Sunday, 11:00 a.m.–7:00 p.m. (note: Paragon will not issue/renew permits past 30 minutes before closing).",
  },
  {
    question: 'How strictly are permits enforced?',
    answer:
      "Enforcement varies widely between courts. Some locations check permits every time, others rarely check, and some courts are permit-free. There are also opportunities to play without a permit during the official season.",
  },
  {
    question: 'Can I play tennis in winter?',
    answer:
      "Yes! After the season ends (late November - March), permits are no longer required at most courts. Many courts remain open, while others close. Some facilities install seasonal 'bubbles' and operate privately with separate fees.",
  },
  {
    question: 'What should I know about court rules?',
    answer:
      "Rules vary significantly: some courts have time limits, reservation systems, or attendants; others are purely first-come, first-serve. Surfaces and conditions also differ by location and borough.",
  },
];

function QAItem({
  qa,
  isMobile,
}: {
  qa: { question: string; answer: string };
  isMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div
      className="relative min-h-[44px]"
      onClick={toggle}
      onMouseEnter={!isMobile ? () => setIsOpen(true) : undefined}
      onMouseLeave={!isMobile ? () => setIsOpen(false) : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
      aria-expanded={isOpen}
    >
      <div className="py-4 md:py-6 cursor-pointer transition-all duration-300">
        <div className="flex items-center justify-between">
          <h3
            className={`text-xl md:text-2xl font-semibold transition-colors duration-300 ${
              isOpen ? 'text-[#2D5A27]' : 'text-[#1A1A1A]'
            }`}
          >
            {qa.question}
          </h3>
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 transition-all duration-300 flex-shrink-0"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <path d="m12 5 7 7-7 7" />
          </motion.svg>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              <p className="text-[#1A1A1A]/85 leading-relaxed text-base md:text-lg">{qa.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MoreSectionProps {
  isMobile?: boolean;
}

export function MoreSection({ isMobile = false }: MoreSectionProps) {
  return (
    <div className="w-full">
      {/* NYC Tennis 101 Q&A Section */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mt-16 md:mt-24 py-12 md:py-16"
      >
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 md:mb-16 text-black text-center"
          >
            SmartCourt NYC 101
          </motion.h2>

          <div className="space-y-8">
            {QA_ITEMS.map((qa, index) => (
              <QAItem key={index} qa={qa} isMobile={isMobile} />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-center text-[#1A1A1A]/75 mt-16 text-lg"
          >
            For specific court details, rules, and permit enforcement, always check our{' '}
            <span className="text-[#2D5A27] font-semibold">Court Finder</span> above.
          </motion.p>
        </div>
      </motion.div>

      {/* Tennis App Promotion Section */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mt-16 md:mt-24 py-16 md:py-20 bg-[#FFFDD0]"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-4xl"
            >
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1A1A1A] leading-tight"
              >
                Tennis convenience starts here
              </motion.h2>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
