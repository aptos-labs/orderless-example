import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AccountAddress } from '@aptos-labs/ts-sdk';
import { aptos, VIEW_FUNCTIONS, GameStats, PlayerUpgrades, PlayerAutoClickers } from '../utils/aptosClient';
import { TransactionManager, TransactionQueue } from '../utils/transactionUtils';

interface GameState {
  // Game data
  isInitialized: boolean;
  gameStats: GameStats | null;
  upgrades: PlayerUpgrades | null;
  autoClickers: PlayerAutoClickers | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  pendingClicks: number;
  optimisticCookies: number;
  
  // Transaction management
  transactionManager: TransactionManager;
  transactionQueue: TransactionQueue[];
  
  // Actions
  refreshGameData: () => Promise<void>;
  setOptimisticCookies: (cookies: number) => void;
  addPendingClicks: (count: number) => void;
  resetPendingClicks: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export function useGameState(): GameState {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const { account, connected } = useWallet();
  
  // Game state
  const [isInitialized, setIsInitialized] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [upgrades, setUpgrades] = useState<PlayerUpgrades | null>(null);
  const [autoClickers, setAutoClickers] = useState<PlayerAutoClickers | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingClicks, setPendingClicks] = useState(0);
  const [optimisticCookies, setOptimisticCookies] = useState(0);
  
  // Transaction management
  const [transactionQueue, setTransactionQueue] = useState<TransactionQueue[]>([]);
  const [transactionManager] = useState(() => 
    new TransactionManager((queue) => setTransactionQueue(queue))
  );

  // Refresh game data from blockchain
  const refreshGameData = async () => {
    if (!connected || !account?.address) {
      setIsInitialized(false);
      setGameStats(null);
      setUpgrades(null);
      setAutoClickers(null);
      return;
    }

    try {
      const playerAddress = AccountAddress.from(account.address);
      
      // Check if player exists by trying to get their cookies
      try {
        const [statsResult, upgradesResult, autoClickersResult] = await Promise.all([
          aptos.view<[string, string, string, string]>({
            payload: {
              function: VIEW_FUNCTIONS.GET_PLAYER_STATS,
              functionArguments: [playerAddress],
            },
          }),
          aptos.view<boolean[]>({
            payload: {
              function: VIEW_FUNCTIONS.GET_PLAYER_UPGRADES,
              functionArguments: [playerAddress],
            },
          }),
          aptos.view<string[]>({
            payload: {
              function: VIEW_FUNCTIONS.GET_PLAYER_AUTO_CLICKERS,
              functionArguments: [playerAddress],
            },
          }),
        ]);

        // Convert string results to numbers
        const stats: GameStats = {
          totalCookies: parseInt(statsResult[0]),
          clickMultiplier: parseInt(statsResult[1]),
          cookiesPerSecond: parseInt(statsResult[2]),
          prestigeLevel: parseInt(statsResult[3]),
        };

        const playerUpgrades = upgradesResult;
        const playerAutoClickers = autoClickersResult.map(count => parseInt(count));

        setGameStats(stats);
        setUpgrades(playerUpgrades);
        setAutoClickers(playerAutoClickers);
        setOptimisticCookies(stats.totalCookies);
        setIsInitialized(true);
        
      } catch (viewError: any) {
        // Player likely not initialized
        console.log('Player not found, needs initialization');
        setIsInitialized(false);
        setGameStats(null);
        setUpgrades(null);
        setAutoClickers(null);
      }
      
    } catch (error: any) {
      console.error('Error fetching game data:', error);
      setError(`Failed to load game data: ${error.message}`);
    }
  };

  // Auto-refresh game data periodically
  useEffect(() => {
    if (connected && account) {
      refreshGameData();
      
      // Refresh every 5 seconds when connected
      const interval = setInterval(refreshGameData, 5000);
      return () => clearInterval(interval);
    } else {
      // Clear data when wallet disconnects
      setIsInitialized(false);
      setGameStats(null);
      setUpgrades(null);
      setAutoClickers(null);
      setOptimisticCookies(0);
    }
  }, [connected, account?.address]);

  // Update optimistic cookies when gameStats change
  useEffect(() => {
    if (gameStats) {
      setOptimisticCookies(gameStats.totalCookies);
    }
  }, [gameStats]);

  // Handle transaction confirmations
  useEffect(() => {
    const confirmedTransactions = transactionQueue.filter(tx => tx.status === 'confirmed');
    if (confirmedTransactions.length > 0) {
      // Refresh game data when transactions are confirmed
      const lastConfirmedTime = Math.max(...confirmedTransactions.map(tx => tx.timestamp));
      const timeSinceLastRefresh = Date.now() - lastConfirmedTime;
      
      // Only refresh if it's been more than 2 seconds since last confirmation
      if (timeSinceLastRefresh > 2000) {
        refreshGameData();
      }
    }
  }, [transactionQueue]);

  const addPendingClicks = (count: number) => {
    setPendingClicks(prev => prev + count);
  };

  const resetPendingClicks = () => {
    setPendingClicks(0);
  };

  const contextValue: GameState = {
    // Game data
    isInitialized,
    gameStats,
    upgrades,
    autoClickers,
    
    // UI state
    loading,
    error,
    pendingClicks,
    optimisticCookies,
    
    // Transaction management
    transactionManager,
    transactionQueue,
    
    // Actions
    refreshGameData,
    setOptimisticCookies,
    addPendingClicks,
    resetPendingClicks,
    setError,
    setLoading,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}