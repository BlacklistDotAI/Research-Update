import { motion } from 'framer-motion';

export const HeroIllustration = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative"
      >
        {/* Main Illustration Container */}
        <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 border border-white/30 shadow-2xl">
          {/* Top Section - Shield with Protection */}
          <div className="flex justify-center mb-6 md:mb-8">
            <motion.div
              className="relative"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Shield Badge */}
              <div className="relative">
                <svg
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-36 lg:h-36 text-white drop-shadow-lg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {/* AI Badge inside shield */}
                <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="text-xl sm:text-2xl md:text-3xl">🤖</div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Middle Section - Phone with Voice Waveform */}
          <div className="relative mb-6 md:mb-8">
            {/* Phone Icon */}
            <div className="flex justify-center mb-3 md:mb-4">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white/90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Animated Voice Waveform */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2">
              {[2, 4, 6, 8, 10, 8, 6, 4, 3, 5, 7, 9, 7, 5, 3, 2].map((height, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-t from-white/90 to-white/60 rounded-full w-[2px] sm:w-[3px]"
                  style={{ minHeight: '4px' }}
                  animate={{
                    height: [`${4 + height * 2}px`, `${4 + (height % 5 + 3) * 2}px`, `${4 + height * 2}px`],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: index * 0.08,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Section - Status Indicators */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {[
              { icon: '🔍', label: 'Analyzing', color: 'from-blue-400/80 to-blue-600/80' },
              { icon: '🤖', label: 'AI Powered', color: 'from-purple-400/80 to-purple-600/80' },
              { icon: '🛡️', label: 'Protected', color: 'from-green-400/80 to-green-600/80' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.7 + index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                className="flex flex-col items-center cursor-default"
              >
                <motion.div
                  className={`bg-gradient-to-br ${item.color} rounded-lg md:rounded-xl p-2 md:p-3 lg:p-4 mb-2 shadow-lg`}
                  whileHover={{ 
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  <div className="text-xl sm:text-2xl md:text-3xl">{item.icon}</div>
                </motion.div>
                <div className="text-xs sm:text-sm md:text-base text-white/90 font-medium text-center leading-tight">
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scanning Lines Animation */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            <motion.div
              className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>

        {/* Decorative Glow Effects */}
        <div className="absolute -z-10 -top-8 -left-8 w-40 h-40 bg-blue-500/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -z-10 -bottom-8 -right-8 w-48 h-48 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating Data Points */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/40 rounded-full"
            style={{
              top: `${15 + (i * 12)}%`,
              left: `${8 + (i % 4) * 30}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

