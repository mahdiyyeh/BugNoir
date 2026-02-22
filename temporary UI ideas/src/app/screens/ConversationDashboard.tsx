import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PremiumButton } from '../components/PremiumButton';
import { GradientOrb } from '../components/GradientOrb';
import { Mic, Square, Volume2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptionLine {
  id: number;
  phonetic: string;
  local: string;
  english: string;
}

const mockTranscriptions: TranscriptionLine[] = [
  {
    id: 1,
    phonetic: "Bohn-zhoor, koh-mohn tah-lay voo?",
    local: "Bonjour, comment allez-vous?",
    english: "Hello, how are you?",
  },
  {
    id: 2,
    phonetic: "Zhuh vay tree bee-en, mehr-see",
    local: "Je vais très bien, merci",
    english: "I'm very well, thank you",
  },
  {
    id: 3,
    phonetic: "Zhuh voo-dray uhn kah-fay, seel voo play",
    local: "Je voudrais un café, s'il vous plaît",
    english: "I would like a coffee, please",
  },
];

export function ConversationDashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [transcriptions, setTranscriptions] = useState<TranscriptionLine[]>([mockTranscriptions[0]]);
  const navigate = useNavigate();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isRecording && currentLine < mockTranscriptions.length - 1) {
      timeout = setTimeout(() => {
        const nextLine = currentLine + 1;
        setCurrentLine(nextLine);
        setTranscriptions(prev => [...prev, mockTranscriptions[nextLine]]);
        setIsRecording(false);
      }, 2500);
    }
    return () => clearTimeout(timeout);
  }, [isRecording, currentLine]);

  const handleEndConvo = () => {
    navigate('/');
  };

  const toggleRecording = () => {
    if (currentLine < mockTranscriptions.length - 1) {
      setIsRecording(!isRecording);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-inter"
      style={{
        background: 'linear-gradient(135deg, #E8F1FF 0%, #D6E8FF 50%, #C5DEFF 100%)',
      }}
    >
      <GradientOrb color="blue" size="large" className="top-[-20%] right-[-20%]" />
      <GradientOrb color="purple" size="medium" className="bottom-[-15%] left-[-15%]" />
      
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-300/40" style={{
              background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)',
            }}>
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-[var(--local-text-primary)]">Practice Session</div>
              <div className="text-xs text-[var(--local-text-secondary)]">
                {transcriptions.length} phrase{transcriptions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleEndConvo}
            className="p-2.5 rounded-xl border border-white/60 text-[var(--local-text-secondary)] hover:text-red-500 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Transcription Area */}
        <div className="flex-1 flex items-start justify-center px-6 py-8 overflow-y-auto">
          <div className="w-full max-w-[500px] space-y-6">
            <AnimatePresence mode="popLayout">
              {transcriptions.map((line, idx) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  className="rounded-3xl p-6 border border-white/60"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    boxShadow: '0 8px 32px 0 rgba(26, 43, 195, 0.1), 0 2px 8px 0 rgba(0, 2, 152, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <div className="space-y-4">
                    {/* Phonetic - Blue gradient */}
                    <div>
                      <div className="text-xs font-medium text-[var(--local-text-muted)] mb-1.5">
                        Pronunciation
                      </div>
                      <div className="text-xl font-bold text-[#1A2BC3]">
                        {line.phonetic}
                      </div>
                    </div>
                    
                    {/* Local - Bold black */}
                    <div>
                      <div className="text-xs font-medium text-[var(--local-text-muted)] mb-1.5">
                        Native Text
                      </div>
                      <div className="text-2xl font-bold text-[var(--local-text-primary)]">
                        {line.local}
                      </div>
                    </div>
                    
                    {/* English - Soft color */}
                    <div>
                      <div className="text-xs font-medium text-[var(--local-text-muted)] mb-1.5">
                        Translation
                      </div>
                      <div className="text-base text-[var(--local-text-secondary)]">
                        {line.english}
                      </div>
                    </div>

                    {/* Play button for pronunciation */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/60 text-[var(--local-text-secondary)] hover:border-[#1A2BC3]/50 hover:text-[#1A2BC3] transition-all text-sm font-semibold"
                      style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      }}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="font-medium">Listen again</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Recording indicator */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-3xl p-6 text-white text-center border border-white/20"
                style={{
                  background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)',
                  boxShadow: '0 12px 32px -4px rgba(26, 43, 195, 0.5), 0 4px 12px -2px rgba(0, 2, 152, 0.3)',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-lg font-semibold"
                >
                  Listening...
                </motion.div>
                <div className="text-sm opacity-80 mt-1">Speak clearly in French</div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Voice Button - Fixed at bottom */}
        <div className="p-6 flex flex-col items-center gap-4">
          <motion.button
            onClick={toggleRecording}
            disabled={currentLine >= mockTranscriptions.length - 1 && !isRecording}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? ''
                : currentLine >= mockTranscriptions.length - 1
                ? 'bg-gray-300 cursor-not-allowed'
                : ''
            }`}
            style={
              isRecording
                ? {
                    background: 'linear-gradient(135deg, #FF6B9D 0%, #FF5E8F 100%)',
                    boxShadow: '0 12px 32px -4px rgba(255, 107, 157, 0.5), 0 4px 12px -2px rgba(255, 94, 143, 0.3)',
                  }
                : currentLine < mockTranscriptions.length - 1
                ? {
                    background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)',
                    boxShadow: '0 12px 32px -4px rgba(26, 43, 195, 0.5), 0 4px 12px -2px rgba(0, 2, 152, 0.3)',
                  }
                : undefined
            }
            whileTap={{ scale: currentLine >= mockTranscriptions.length - 1 ? 1 : 0.9 }}
            whileHover={{ scale: currentLine >= mockTranscriptions.length - 1 ? 1 : 1.05 }}
          >
            {isRecording ? (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#FF6B9D' }}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <Square className="w-8 h-8 text-white fill-white z-10" />
              </>
            ) : (
              <Mic className="w-9 h-9 text-white z-10" />
            )}
          </motion.button>

          <div className="text-center">
            <div className="text-sm font-medium text-[var(--local-text-primary)]">
              {isRecording 
                ? 'Tap to stop' 
                : currentLine >= mockTranscriptions.length - 1
                ? 'Session complete!'
                : 'Tap to speak'}
            </div>
            {!isRecording && currentLine < mockTranscriptions.length - 1 && (
              <div className="text-xs text-[var(--local-text-muted)] mt-1">
                Hold the button while speaking
              </div>
            )}
          </div>

          {currentLine >= mockTranscriptions.length - 1 && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[300px]"
            >
              <PremiumButton
                variant="primary"
                fullWidth
                onClick={() => navigate('/')}
              >
                New Session
              </PremiumButton>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}