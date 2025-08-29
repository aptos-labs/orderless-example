import React, { useEffect, useState, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';
import './FallingCookies.css';

interface Cookie {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
  rotation: number;
  emoji: string;
  burst?: boolean;
}

const cookieEmojis = ['🍪', '🥠', '🧁', '🍩', '🎂', '🍰'];
const burstEmojis = ['✨', '💫', '⭐', '🌟'];

const FallingCookies: React.FC = () => {
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const { pendingClicks, gameStats, optimisticCookies } = useGameState();
  const lastCookieCountRef = useRef(0);

  useEffect(() => {
    // Base interval based on game progression
    const baseInterval = gameStats ? Math.max(300, 1000 - (gameStats.prestigeLevel * 50)) : 800;
    
    // Speed up falling during active clicking
    const currentInterval = pendingClicks > 0 ? baseInterval / 3 : baseInterval;
    
    const createCookie = (isBurst = false) => {
      const newCookie: Cookie = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        animationDuration: isBurst ? 1 + Math.random() * 2 : 3 + Math.random() * 4,
        size: isBurst ? 15 + Math.random() * 15 : 20 + Math.random() * 20,
        rotation: Math.random() * 360,
        emoji: isBurst 
          ? burstEmojis[Math.floor(Math.random() * burstEmojis.length)]
          : cookieEmojis[Math.floor(Math.random() * cookieEmojis.length)],
        burst: isBurst
      };
      
      setCookies(prev => [...prev, newCookie]);
      
      // Remove cookie after animation completes
      setTimeout(() => {
        setCookies(prev => prev.filter(cookie => cookie.id !== newCookie.id));
      }, newCookie.animationDuration * 1000);
    };

    // Create regular falling cookies
    const interval = setInterval(() => createCookie(false), currentInterval);
    
    // Create initial cookies
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createCookie(false), i * 200);
    }

    return () => clearInterval(interval);
  }, [pendingClicks, gameStats]);

  // Create burst effect when cookie count increases significantly
  useEffect(() => {
    const currentCount = optimisticCookies;
    const lastCount = lastCookieCountRef.current;
    const increase = currentCount - lastCount;
    
    if (increase > 0 && lastCount > 0) {
      // Create burst cookies for big increases
      const burstCount = Math.min(Math.floor(increase / 10), 8);
      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
          const burstCookie: Cookie = {
            id: Date.now() + Math.random() + i,
            left: 20 + Math.random() * 60, // More centered
            animationDuration: 0.5 + Math.random() * 1,
            size: 25 + Math.random() * 15,
            rotation: Math.random() * 360,
            emoji: burstEmojis[Math.floor(Math.random() * burstEmojis.length)],
            burst: true
          };
          
          setCookies(prev => [...prev, burstCookie]);
          
          setTimeout(() => {
            setCookies(prev => prev.filter(cookie => cookie.id !== burstCookie.id));
          }, burstCookie.animationDuration * 1000);
        }, i * 100);
      }
    }
    
    lastCookieCountRef.current = currentCount;
  }, [optimisticCookies]);

  return (
    <div className="falling-cookies-container">
      {cookies.map(cookie => (
        <div
          key={cookie.id}
          className={`falling-cookie ${cookie.burst ? 'burst-cookie' : ''}`}
          style={{
            left: `${cookie.left}%`,
            animationDuration: `${cookie.animationDuration}s`,
            fontSize: `${cookie.size}px`,
            transform: `rotate(${cookie.rotation}deg)`,
            '--rotation-end': `${cookie.rotation + 360}deg`
          } as React.CSSProperties & { '--rotation-end': string }}
        >
          {cookie.emoji}
        </div>
      ))}
    </div>
  );
};

export default FallingCookies;
