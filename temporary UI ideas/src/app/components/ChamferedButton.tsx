import { ButtonHTMLAttributes } from 'react';

interface ChamferedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'solid' | 'danger';
  selected?: boolean;
}

export function ChamferedButton({
  children,
  variant = 'glass',
  selected = false,
  className = '',
  ...props
}: ChamferedButtonProps) {
  const baseStyles = "px-6 py-3 transition-all duration-200 relative overflow-hidden";
  const fontStyles = "font-['Libre_Baskerville',_serif]";
  
  let variantStyles = '';
  if (variant === 'solid' || selected) {
    variantStyles = 'bg-[var(--rbt-royal-blue)] text-white';
  } else if (variant === 'danger') {
    variantStyles = 'bg-[var(--rbt-soft-red)] text-white';
  } else {
    variantStyles = 'bg-[var(--glass-bg)] text-[var(--rbt-deep-slate)] border border-white';
  }
  
  return (
    <button
      className={`${baseStyles} ${fontStyles} ${variantStyles} ${className}`}
      style={{
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        backdropFilter: variant === 'glass' && !selected ? 'blur(var(--glass-blur))' : 'none',
        WebkitBackdropFilter: variant === 'glass' && !selected ? 'blur(var(--glass-blur))' : 'none',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
