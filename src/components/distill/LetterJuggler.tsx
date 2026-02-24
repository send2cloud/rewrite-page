import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WORDS = [
  'rewriting', 'distilling', 'remixing', 'translating',
  'absorbing', 'digesting', 'decoding', 'reshaping',
  'brewing', 'composing', 'conjuring', 'imagining',
];

const LetterJuggler = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const word = WORDS[wordIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8 select-none">
      {/* Juggling letters */}
      <div className="h-16 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={word}
            className="flex gap-[2px]"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
              exit: { transition: { staggerChildren: 0.03 } },
            }}
          >
            {word.split('').map((letter, i) => (
              <motion.span
                key={`${word}-${i}`}
                className="text-4xl sm:text-5xl font-serif font-bold text-foreground inline-block"
                variants={{
                  hidden: {
                    y: 40 * (i % 2 === 0 ? 1 : -1),
                    rotate: (Math.random() - 0.5) * 60,
                    opacity: 0,
                    scale: 0.5,
                  },
                  visible: {
                    y: 0,
                    rotate: 0,
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                    },
                  },
                  exit: {
                    y: -30 * (i % 2 === 0 ? -1 : 1),
                    rotate: (Math.random() - 0.5) * 40,
                    opacity: 0,
                    scale: 0.7,
                    transition: { duration: 0.2 },
                  },
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bouncing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground/40"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LetterJuggler;
