import { ButtonHTMLAttributes } from 'react';
import { motion } from 'motion/react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  selected?: boolean;
  fullWidth?: boolean;
}

export function PremiumButton({
  children,
  variant = 'secondary',
  selected = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: PremiumButtonProps) {
  let buttonStyles = 'px-6 py-4 rounded-2xl font-inter font-semibold transition-all duration-200 ';
  
  if (fullWidth) {
    buttonStyles += 'w-full ';
  }
  
  if (disabled) {
    buttonStyles += 'opacity-50 cursor-not-allowed ';
  }
  
  if (variant === 'primary' || selected) {
    return (
      <motion.button
        className={`${buttonStyles} ${className} text-white relative overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)',
          boxShadow: '0 8px 24px -4px rgba(26, 43, 195, 0.4), 0 4px 12px -2px rgba(0, 2, 152, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
        }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        disabled={disabled}
        {...props}
      >
        <div className="relative z-10">{children}</div>
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          }}
        />
      </motion.button>
    );
  } else if (variant === 'danger') {
    buttonStyles += 'bg-gradient-to-r from-[#FF6B9D] to-[#FF5E8F] text-white shadow-lg shadow-pink-200/50 hover:shadow-xl hover:shadow-pink-200/60 ';
  } else if (variant === 'ghost') {
    buttonStyles += 'bg-transparent text-[var(--local-text-secondary)] hover:bg-white/30 backdrop-blur-xl ';
  } else {
    return (
      <motion.button
        className={`${buttonStyles} ${className} text-[var(--local-text-primary)] border border-white/60 relative overflow-hidden`}
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 4px 16px 0 rgba(26, 43, 195, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
        }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      className={`${buttonStyles} ${className}`}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
