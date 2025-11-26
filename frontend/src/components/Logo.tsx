import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface LogoProps {
  variant?: 'header' | 'footer';
  className?: string;
}

export const Logo = ({ variant = 'header', className = '' }: LogoProps) => {
  // Header: Image logo from logo-blacklist.jpg
  if (variant === 'header') {
    return (
      <Link to="/" className="group">
        <motion.div 
          className={`flex items-center ${className}`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <img 
            src="/logo-blacklist.jpg" 
            alt="BLACKLIST.VN" 
            className="h-8 sm:h-10 md:h-12 w-auto max-w-[180px] sm:max-w-[220px] md:max-w-none object-contain"
          />
        </motion.div>
      </Link>
    );
  }

  // Footer: No logo (removed as requested)
  return null;
};

