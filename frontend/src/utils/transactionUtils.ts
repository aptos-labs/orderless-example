// import { any } from '@aptos-labs/ts-sdk';
import { WalletContextState } from '@aptos-labs/wallet-adapter-react';
import { aptos, CONTRACT_FUNCTIONS } from './aptosClient';

export interface TransactionQueue {
  id: string;
  type: 'click' | 'upgrade' | 'auto_clicker' | 'collect_passive' | 'prestige';
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  hash?: string;
  timestamp: number;
  optimisticUpdate?: any;
}

export class TransactionManager {
  private queue: TransactionQueue[] = [];
  private onUpdate?: (queue: TransactionQueue[]) => void;

  constructor(onUpdate?: (queue: TransactionQueue[]) => void) {
    this.onUpdate = onUpdate;
  }

  addToQueue(transaction: Omit<TransactionQueue, 'timestamp'>): string {
    const queueItem: TransactionQueue = {
      ...transaction,
      timestamp: Date.now(),
    };
    
    this.queue.push(queueItem);
    this.notifyUpdate();
    return queueItem.id;
  }

  updateTransaction(id: string, updates: Partial<TransactionQueue>) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue[index] = { ...this.queue[index], ...updates };
      this.notifyUpdate();
    }
  }

  removeFromQueue(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.notifyUpdate();
  }

  getQueue(): TransactionQueue[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.filter(item => item.status === 'pending' || item.status === 'submitted').length;
  }

  private notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate(this.getQueue());
    }
  }

  // Clean old transactions (keep last 50)
  cleanup() {
    if (this.queue.length > 50) {
      this.queue = this.queue.slice(-50);
      this.notifyUpdate();
    }
  }
}

export async function submitTransaction(
  wallet: WalletContextState,
  transactionData: any,
  manager: TransactionManager,
  transactionType: TransactionQueue['type'],
  optimisticUpdate?: any
): Promise<string> {
  
  if (!wallet.connected || !wallet.account) {
    throw new Error('Wallet not connected');
  }

  const transactionId = `${transactionType}_${Date.now()}_${Math.random()}`;
  
  // Add to queue
  manager.addToQueue({
    id: transactionId,
    type: transactionType,
    status: 'pending',
    optimisticUpdate,
  });

  try {
    // Submit transaction - don't wait for confirmation
    const response = await wallet.signAndSubmitTransaction(transactionData);
    const transactionHash = response.hash;

    // Update queue with hash
    manager.updateTransaction(transactionId, {
      status: 'submitted',
      hash: transactionHash,
    });

    // Wait for confirmation in background
    waitForTransactionConfirmation(transactionHash, transactionId, manager);

    return transactionHash;
  } catch (error) {
    console.error('Transaction failed:', error);
    manager.updateTransaction(transactionId, {
      status: 'failed',
    });
    throw error;
  }
}

async function waitForTransactionConfirmation(
  hash: string,
  transactionId: string,
  manager: TransactionManager
) {
  try {
    await aptos.waitForTransaction({
      transactionHash: hash,
    });
    
    manager.updateTransaction(transactionId, {
      status: 'confirmed',
    });

    // Clean up old transactions periodically
    setTimeout(() => manager.cleanup(), 1000);
  } catch (error) {
    console.error('Transaction confirmation failed:', error);
    manager.updateTransaction(transactionId, {
      status: 'failed',
    });
  }
}

// Orderless transaction helpers
export async function submitMultipleClicks(
  wallet: WalletContextState,
  manager: TransactionManager,
  clickCount: number,
  cookiesPerClick: number
): Promise<string[]> {
  
  if (!wallet.connected || !wallet.account) {
    throw new Error('Wallet not connected');
  }

  const promises: Promise<string>[] = [];

  for (let i = 0; i < clickCount; i++) {
    const transactionData: any = {
      data: {
        function: CONTRACT_FUNCTIONS.CLICK_COOKIE,
        functionArguments: [],
      },
    };

    promises.push(
      submitTransaction(
        wallet,
        transactionData,
        manager,
        'click',
        { cookies: cookiesPerClick }
      )
    );
  }

  // Submit all clicks simultaneously - orderless processing
  try {
    const results = await Promise.allSettled(promises);
    const successful = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);

    console.log(`Submitted ${successful.length}/${clickCount} clicks successfully`);
    return successful;
  } catch (error) {
    console.error('Error submitting multiple clicks:', error);
    throw error;
  }
}

// Initialize player transaction
export async function initializePlayer(wallet: WalletContextState): Promise<string> {
  if (!wallet.connected || !wallet.account) {
    throw new Error('Wallet not connected');
  }

  const transactionData: any = {
    data: {
      function: CONTRACT_FUNCTIONS.INITIALIZE_PLAYER,
      functionArguments: [],
    },
  };

  const response = await wallet.signAndSubmitTransaction(transactionData);
  await aptos.waitForTransaction({ transactionHash: response.hash });
  return response.hash;
}

// Buy upgrade transaction
export async function buyUpgrade(
  wallet: WalletContextState,
  manager: TransactionManager,
  upgradeId: number
): Promise<string> {
  if (!wallet.connected || !wallet.account) {
    throw new Error('Wallet not connected');
  }

  const transactionData: any = {
    data: {
      function: CONTRACT_FUNCTIONS.BUY_UPGRADE,
      functionArguments: [upgradeId],
    },
  };

  return submitTransaction(wallet, transactionData, manager, 'upgrade');
}

// Buy auto clicker transaction
export async function buyAutoClicker(
  wallet: WalletContextState,
  manager: TransactionManager,
  typeId: number,
  quantity: number
): Promise<string> {
  if (!wallet.connected || !wallet.account) {
    throw new Error('Wallet not connected');
  }

  const transactionData: any = {
    data: {
      function: CONTRACT_FUNCTIONS.BUY_AUTO_CLICKER,
      functionArguments: [typeId, quantity],
    },
  };

  return submitTransaction(wallet, transactionData, manager, 'auto_clicker');
}

// Collect passive cookies transaction
export async function collectPassiveCookies(
  wallet: WalletContextState,
  manager: TransactionManager
): Promise<string> {
  if (!wallet.connected || !wallet.account) {
    throw new Error('Wallet not connected');
  }

  const transactionData: any = {
    data: {
      function: CONTRACT_FUNCTIONS.COLLECT_PASSIVE_COOKIES,
      functionArguments: [],
    },
  };

  return submitTransaction(wallet, transactionData, manager, 'collect_passive');
}

// Prestige transaction
export async function prestigeReset(
  wallet: WalletContextState,
  manager: TransactionManager
): Promise<string> {
  if (!wallet.connected || !wallet.account) {
    throw new Error('Wallet not connected');
  }

  const transactionData: any = {
    data: {
      function: CONTRACT_FUNCTIONS.PRESTIGE,
      functionArguments: [],
    },
  };

  return submitTransaction(wallet, transactionData, manager, 'prestige');
}