import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { PremiumCard } from '../components/PremiumCard';
import { PremiumButton } from '../components/PremiumButton';
import { GradientOrb } from '../components/GradientOrb';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

const hobbyExamples = [
  'Photography',
  'Cooking',
  'Reading',
  'Gaming',
  'Sports',
  'Music',
];

export function HobbiesStep() {
  const [hobby, setHobby] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNext = () => {
    if (hobby.trim()) {
      navigate('/conversation', { 
        state: { ...location.state, hobby } 
      });
    }
  };

  const selectExample = (example: string) => {
    setHobby(example);
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-inter flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #E8F1FF 0%, #D6E8FF 50%, #C5DEFF 100%)',
      }}
    >
      <GradientOrb color="blue" size="large" className="top-[-15%] left-[-15%]" />
      <GradientOrb color="purple" size="medium" className="bottom-[-10%] right-[-10%]" />
      
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
              <div className="h-1.5 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #1A2BC3 0%, #000298 100%)' }} />
            </div>

            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[#1A2BC3] text-xs font-semibold" style={{ background: 'rgba(26, 43, 195, 0.1)' }}>
                Step 3 of 3
              </span>
              <h2 className="text-2xl font-bold text-[var(--local-text-primary)]">
                Tell us about a hobby
              </h2>
              <p className="text-[var(--local-text-secondary)] text-sm">
                We'll use this to personalize your conversations
              </p>
            </div>
            
            <div className="relative pt-2">
              <motion.div
                animate={{
                  boxShadow: isFocused 
                    ? '0 0 0 3px rgba(26, 43, 195, 0.15)' 
                    : '0 0 0 0px rgba(26, 43, 195, 0)',
                }}
                className="rounded-2xl"
              >
                <input
                  type="text"
                  value={hobby}
                  onChange={(e) => setHobby(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g., Photography, Cooking..."
                  className="w-full px-5 py-4 rounded-2xl border-2 border-white/60 text-[var(--local-text-primary)] placeholder:text-[var(--local-text-muted)] focus:outline-none focus:border-[#1A2BC3] transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  }}
                />
              </motion.div>

              {hobby && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-4 top-6 flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4 text-[#1A2BC3]" />
                </motion.div>
              )}
            </div>

            {/* Example chips */}
            {!hobby && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="text-xs text-[var(--local-text-muted)] text-center">
                  or choose from popular hobbies
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {hobbyExamples.map((example) => (
                    <motion.button
                      key={example}
                      onClick={() => selectExample(example)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-full border border-white/60 text-[var(--local-text-secondary)] text-sm hover:border-[#1A2BC3]/50 hover:text-[#1A2BC3] transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      }}
                    >
                      {example}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {hobby.trim() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <PremiumButton
                  variant="primary"
                  fullWidth
                  onClick={handleNext}
                >
                  Start Your Journey
                </PremiumButton>
              </motion.div>
            )}
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
}