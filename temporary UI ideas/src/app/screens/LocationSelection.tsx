import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PremiumButton } from '../components/PremiumButton';
import { GradientOrb } from '../components/GradientOrb';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';

const locations = [
  { name: 'Paris', flag: '🇫🇷', language: 'French' },
  { name: 'Tokyo', flag: '🇯🇵', language: 'Japanese' },
  { name: 'Barcelona', flag: '🇪🇸', language: 'Spanish' },
  { name: 'Rome', flag: '🇮🇹', language: 'Italian' },
  { name: 'Berlin', flag: '🇩🇪', language: 'German' },
  { name: 'Seoul', flag: '🇰🇷', language: 'Korean' },
];

export function LocationSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected) {
      navigate('/personality', { state: { location: selected } });
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-inter"
      style={{
        background: 'linear-gradient(135deg, #E8F1FF 0%, #D6E8FF 50%, #C5DEFF 100%)',
      }}
    >
      {/* Decorative Orbs */}
      <GradientOrb color="blue" size="large" className="top-[-10%] right-[-10%]" />
      <GradientOrb color="purple" size="medium" className="bottom-[-5%] left-[-5%]" />
      
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[420px] space-y-8"
        >
          {/* Logo/Brand */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl shadow-blue-300/50 mb-4"
              style={{
                background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)',
              }}
            >
              <MapPin className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[var(--local-text-primary)] tracking-tight">
              Local
            </h1>
            <p className="text-[var(--local-text-secondary)] text-base">
              Your AI language coach
            </p>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-semibold text-[var(--local-text-primary)]">
              Where are you traveling?
            </h2>
            <p className="text-[var(--local-text-secondary)] text-sm">
              Select your destination to get started
            </p>
          </motion.div>
          
          {/* Location Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {locations.map((location, index) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <button
                  onClick={() => setSelected(location.name)}
                  className={`w-full p-5 rounded-2xl font-semibold transition-all duration-300 border ${
                    selected === location.name
                      ? 'text-white scale-105 border-transparent'
                      : 'text-[var(--local-text-primary)] border-white/60'
                  }`}
                  style={
                    selected === location.name
                      ? {
                          background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)',
                          boxShadow: '0 12px 32px -4px rgba(26, 43, 195, 0.5), 0 4px 12px -2px rgba(0, 2, 152, 0.3)',
                        }
                      : {
                          background: 'rgba(255, 255, 255, 0.7)',
                          backdropFilter: 'blur(20px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                          boxShadow: '0 4px 16px 0 rgba(26, 43, 195, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
                        }
                  }
                >
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-3xl">{location.flag}</span>
                    <span className="font-semibold">{location.name}</span>
                    <span className={`text-xs ${selected === location.name ? 'text-white/80' : 'text-[var(--local-text-muted)]'}`}>
                      {location.language}
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Continue Button */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <PremiumButton
                variant="primary"
                fullWidth
                onClick={handleContinue}
              >
                Continue to Onboarding
              </PremiumButton>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}