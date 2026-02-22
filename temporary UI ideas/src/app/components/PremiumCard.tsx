import { ReactNode } from 'react';

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
}

export function PremiumCard({ children, className = '' }: PremiumCardProps) {
  return (
    <div
      className={`rounded-3xl p-8 border border-white/60 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '0 8px 32px 0 rgba(26, 43, 195, 0.1), 0 2px 8px 0 rgba(0, 2, 152, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
      }}
    >
      {children}
    </div>
  );
}
