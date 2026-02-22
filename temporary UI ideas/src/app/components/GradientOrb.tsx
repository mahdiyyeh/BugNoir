export function GradientOrb({ 
  className = '', 
  color = 'blue',
  size = 'large' 
}: { 
  className?: string;
  color?: 'blue' | 'pink' | 'purple';
  size?: 'small' | 'medium' | 'large';
}) {
  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-64 h-64',
    large: 'w-96 h-96'
  };

  const colorGradients = {
    blue: 'from-blue-200/40 via-blue-300/30 to-cyan-200/20',
    pink: 'from-pink-200/40 via-purple-300/30 to-blue-200/20',
    purple: 'from-purple-200/40 via-blue-300/30 to-pink-200/20'
  };

  return (
    <div className={`absolute ${sizeClasses[size]} ${className}`}>
      <div 
        className={`w-full h-full rounded-full bg-gradient-to-br ${colorGradients[color]} blur-3xl opacity-60`}
        style={{ filter: 'blur(80px)' }}
      />
    </div>
  );
}
