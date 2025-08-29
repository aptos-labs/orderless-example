import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Button, Typography, message } from 'antd';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useGameState } from '../hooks/useGameState';
import { submitMultipleClicks } from '../utils/transactionUtils';

const { Title, Text } = Typography;

interface ClickParticle {
  id: string;
  x: number;
  y: number;
  value: number;
}

const CookieDisplay: React.FC = () => {
  const wallet = useWallet();
  const {
    gameStats,
    optimisticCookies,
    setOptimisticCookies,
    addPendingClicks,
    transactionManager,
    pendingClicks,
  } = useGameState();

  const [isClicking, setIsClicking] = useState(false);
  const [clickParticles, setClickParticles] = useState<ClickParticle[]>([]);
  const [rapidClickCount, setRapidClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const cookieRef = useRef<HTMLDivElement>(null);
  const rapidClickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clickMultiplier = gameStats?.clickMultiplier || 1;

  // Clear rapid click counter after inactivity
  useEffect(() => {
    if (rapidClickCount > 0) {
      rapidClickTimer.current = setTimeout(() => {
        setRapidClickCount(0);
      }, 1000);
    }
    return () => {
      if (rapidClickTimer.current) {
        clearTimeout(rapidClickTimer.current);
      }
    };
  }, [rapidClickCount]);

  const createClickParticle = useCallback((event: React.MouseEvent) => {
    if (!cookieRef.current) return;

    const rect = cookieRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const particle: ClickParticle = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      value: clickMultiplier,
    };

    setClickParticles(prev => [...prev, particle]);

    // Remove particle after animation
    setTimeout(() => {
      setClickParticles(prev => prev.filter(p => p.id !== particle.id));
    }, 1500);
  }, [clickMultiplier]);

  // const handleSingleClick = async (event: React.MouseEvent) => {
  //   createClickParticle(event);
  //   
  //   // Update optimistic cookies immediately
  //   setOptimisticCookies(optimisticCookies + clickMultiplier);
  //   addPendingClicks(1);

  //   try {
  //     await submitMultipleClicks(wallet, transactionManager, 1, clickMultiplier);
  //   } catch (error: any) {
  //     console.error('Click failed:', error);
  //     message.error(`Click failed: ${error.message}`);
  //     // Revert optimistic update
  //     setOptimisticCookies(optimisticCookies);
  //   }
  // };

  const handleRapidClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    
    const now = Date.now();
    const timeDiff = now - lastClickTime;
    
    // If clicking rapidly (within 100ms), accumulate clicks
    if (timeDiff < 100 && rapidClickCount < 10) {
      setRapidClickCount(prev => prev + 1);
      setLastClickTime(now);
      return;
    }

    const clicksToSubmit = Math.max(1, rapidClickCount + 1);
    createClickParticle(event);
    
    // Reset rapid click counter
    setRapidClickCount(0);
    setLastClickTime(now);

    // Update optimistic cookies
    const cookiesToAdd = clicksToSubmit * clickMultiplier;
    setOptimisticCookies(optimisticCookies + cookiesToAdd);
    addPendingClicks(clicksToSubmit);

    try {
      setIsClicking(true);
      await submitMultipleClicks(wallet, transactionManager, clicksToSubmit, clickMultiplier);
      
      if (clicksToSubmit > 1) {
        message.success(`Submitted ${clicksToSubmit} clicks! (Orderless processing)`);
      }
    } catch (error: any) {
      console.error('Rapid click failed:', error);
      message.error(`Clicks failed: ${error.message}`);
      // Revert optimistic update
      setOptimisticCookies(optimisticCookies);
    } finally {
      setIsClicking(false);
    }
  }, [
    wallet, 
    transactionManager, 
    clickMultiplier, 
    optimisticCookies, 
    setOptimisticCookies, 
    addPendingClicks, 
    rapidClickCount, 
    lastClickTime
  ]);

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  return (
    <Card className="glass-card text-center" bodyStyle={{ padding: '32px' }}>
      <Title level={3} className="text-white mb-6">
        🍪 Cookie Clicker
      </Title>

      {/* Cookie Counter */}
      <div className="mb-8">
        <div className="text-6xl font-bold text-yellow-400 mb-2">
          {formatNumber(optimisticCookies)}
        </div>
        <Text className="text-gray-300 text-xl">cookies</Text>
        {pendingClicks > 0 && (
          <div className="mt-2">
            <Text className="text-orange-400 text-sm">
              +{pendingClicks} clicks pending...
            </Text>
          </div>
        )}
      </div>

      {/* Cookie Button */}
      <div className="relative mb-8" ref={cookieRef}>
        <Button
          type="primary"
          size="large"
          className={`
            cookie-button w-48 h-48 rounded-full text-8xl border-8 border-yellow-600
            bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500
            shadow-2xl transform transition-all duration-100
            ${isClicking ? 'scale-95' : 'hover:scale-105'}
            ${rapidClickCount > 0 ? 'animate-pulse-fast' : ''}
          `}
          loading={isClicking}
          onClick={handleRapidClick}
          disabled={!gameStats}
        >
          {!isClicking && '🍪'}
        </Button>

        {/* Click Particles */}
        {clickParticles.map((particle) => (
          <div
            key={particle.id}
            className="click-particle"
            style={{
              left: particle.x,
              top: particle.y,
            }}
          >
            +{particle.value}
          </div>
        ))}

        {/* Rapid Click Counter */}
        {rapidClickCount > 0 && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce">
              {rapidClickCount + 1}x COMBO!
            </div>
          </div>
        )}
      </div>

      {/* Click Info */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-gray-800 rounded-lg p-4">
          <Text className="text-gray-400 block mb-1">Cookies per Click</Text>
          <Text className="text-white text-2xl font-bold">
            {formatNumber(clickMultiplier)}
          </Text>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <Text className="text-gray-400 block mb-1">Cookies per Second</Text>
          <Text className="text-white text-2xl font-bold">
            {formatNumber(gameStats?.cookiesPerSecond || 0)}
          </Text>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-400">
        <p>Click rapidly for combo multipliers!</p>
        <p>Multiple clicks process simultaneously thanks to orderless transactions.</p>
      </div>
    </Card>
  );
};

export default CookieDisplay;