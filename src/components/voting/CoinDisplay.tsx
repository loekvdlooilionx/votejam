import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface CoinDisplayProps {
  coinsLeft: number;
  maxCoins?: number;
}

export function CoinDisplay({ coinsLeft, maxCoins = 3 }: CoinDisplayProps) {
  return (
    <div className="flex items-center gap-3 bg-secondary/50 rounded-full px-4 py-2">
      <div className="flex gap-1">
        {Array.from({ length: maxCoins }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              opacity: i < coinsLeft ? 1 : 0.3 
            }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              i < coinsLeft ? 'gradient-coin glow-coin' : 'bg-muted'
            }`}
          >
            <Coins className={`w-3 h-3 ${i < coinsLeft ? 'text-black' : 'text-muted-foreground'}`} />
          </motion.div>
        ))}
      </div>
      <span className="text-sm font-semibold text-coin-gold">
        {coinsLeft} / {maxCoins}
      </span>
    </div>
  );
}
