import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { PremiumCard } from '../components/PremiumCard';
import { PremiumButton } from '../components/PremiumButton';
import { GradientOrb } from '../components/GradientOrb';
import { motion } from 'motion/react';
import { User, Briefcase, Heart, Users } from 'lucide-react';

const personalityOptions = [
  { label: 'Professional', icon: Briefcase, description: 'Business focused' },
  { label: 'Friendly', icon: Heart, description: 'Warm & approachable' },
  { label: 'Casual', icon: Users, description: 'Relaxed & easy-going' },
  { label: 'Formal', icon: User, description: 'Polite & respectful' },
];

export function PersonalityStep() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNext = () => {
    if (selected) {
      navigate('/interests', { 
        state: { ...location.state, personality: selected } 
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
      <GradientOrb color="blue" size="large" className="top-[-15%] left-[-15%]" />
      <GradientOrb color="pink" size="medium" className="bottom-[-10%] right-[-10%]" />
      
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
              <div className="h-1.5 flex-1 rounded-full bg-white/40" />
              <div className="h-1.5 flex-1 rounded-full bg-white/40" />
            </div>

            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[#1A2BC3] text-xs font-semibold" style={{ background: 'rgba(26, 43, 195, 0.1)' }}>
                Step 1 of 3
              </span>
              <h2 className="text-2xl font-bold text-[var(--local-text-primary)]">
                Choose your style
              </h2>
              <p className="text-[var(--local-text-secondary)] text-sm">
                How would you like to communicate?
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              {personalityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.label}
                    onClick={() => setSelected(option.label)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-5 rounded-xl font-semibold transition-all duration-300 text-left border ${
                      selected === option.label
                        ? 'text-white border-transparent'
                        : 'text-[var(--local-text-primary)] border-white/60'
                    }`}
                    style={
                      selected === option.label
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
                    <div className="space-y-2">
                      <Icon className={`w-6 h-6 ${selected === option.label ? 'text-white' : 'text-[#1A2BC3]'}`} />
                      <div className="space-y-0.5">
                        <div className="font-semibold">{option.label}</div>
                        <div className={`text-xs ${selected === option.label ? 'text-white/80' : 'text-[var(--local-text-muted)]'}`}>
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {selected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2"
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