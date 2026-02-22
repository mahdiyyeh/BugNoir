import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { PremiumCard } from '../components/PremiumCard';
import { PremiumButton } from '../components/PremiumButton';
import { GradientOrb } from '../components/GradientOrb';
import { motion } from 'motion/react';
import { UtensilsCrossed, Palette, ShoppingBag, Music, Landmark, Trees } from 'lucide-react';

const interestOptions = [
  { label: 'Food & Dining', icon: UtensilsCrossed, color: 'from-orange-400 to-red-400' },
  { label: 'Art & Culture', icon: Palette, color: 'from-purple-400 to-pink-400' },
  { label: 'Shopping', icon: ShoppingBag, color: 'from-blue-400 to-cyan-400' },
  { label: 'Nightlife', icon: Music, color: 'from-indigo-400 to-purple-400' },
  { label: 'History', icon: Landmark, color: 'from-amber-400 to-orange-400' },
  { label: 'Nature', icon: Trees, color: 'from-green-400 to-emerald-400' },
];

export function InterestsStep() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (selected.length > 0) {
      navigate('/hobbies', { 
        state: { ...location.state, interests: selected } 
      });
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-inter flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #E8F1FF 0%, #D6E8FF 50%, #C5DEFF 100%)',
      }}
    >
      <GradientOrb color="purple" size="large" className="top-[-15%] right-[-15%]" />
      <GradientOrb color="blue" size="medium" className="bottom-[-10%] left-[-10%]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <PremiumCard>
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #1A2BC3 0%, #000298 100%)' }} />
              <div className="h-1.5 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #1A2BC3 0%, #000298 100%)' }} />
              <div className="h-1.5 flex-1 rounded-full bg-white/40" />
            </div>

            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[#1A2BC3] text-xs font-semibold" style={{ background: 'rgba(26, 43, 195, 0.1)' }}>
                Step 2 of 3
              </span>
              <h2 className="text-2xl font-bold text-[var(--local-text-primary)]">
                What interests you?
              </h2>
              <p className="text-[var(--local-text-secondary)] text-sm">
                Select topics you'd like to discuss
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              {interestOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selected.includes(option.label);
                return (
                  <motion.button
                    key={option.label}
                    onClick={() => toggleInterest(option.label)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-5 rounded-xl font-semibold transition-all duration-300 text-left relative overflow-hidden border ${
                      isSelected
                        ? 'text-white border-transparent'
                        : 'text-[var(--local-text-primary)] border-white/60'
                    }`}
                    style={
                      isSelected
                        ? {
                            background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)',
                            boxShadow: '0 8px 24px -4px rgba(26, 43, 195, 0.4), 0 4px 12px -2px rgba(0, 2, 152, 0.3)',
                          }
                        : {
                            background: 'rgba(255, 255, 255, 0.6)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                            boxShadow: '0 4px 16px 0 rgba(26, 43, 195, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
                          }
                    }
                  >
                    <div className="relative z-10 space-y-2">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-[#1A2BC3]'}`} />
                      <div className="font-semibold text-sm leading-tight">{option.label}</div>
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        layoutId={`check-${option.label}`}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255, 255, 255, 0.25)' }}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="text-center text-xs text-[var(--local-text-muted)]">
              {selected.length === 0 ? 'Select at least one' : `${selected.length} selected`}
            </div>

            {selected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <PremiumButton
                  variant="primary"
                  fullWidth
                  onClick={handleNext}
                >
                  Continue
                </PremiumButton>
              </motion.div>
            )}
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
}