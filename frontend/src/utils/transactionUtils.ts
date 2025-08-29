import { Account } from '@aptos-labs/ts-sdk';
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

// Universal transaction executor that works with both wallet and local accounts
export class UniversalTransactionExecutor {
  constructor(
    private localAccount: Account | null,
    private wallet: WalletContextState | null,
    private accountType: 'wallet' | 'local' | null
  ) {}

  async executeTransaction(functionName: string, args: any[] = []): Promise<string> {
    if (this.accountType === 'local' && this.localAccount) {
      return this.executeWithLocalAccount(functionName, args);
    } else if (this.accountType === 'wallet' && this.wallet) {
      return this.executeWithWallet(functionName, args);
    } else {
      throw new Error('No valid account available for transaction');
    }
  }

  private async executeWithLocalAccount(functionName: string, args: any[]): Promise<string> {
    if (!this.localAccount) {
      throw new Error('Local account not available');
    }

    const transaction = await aptos.transaction.build.simple({
      sender: this.localAccount.accountAddress,
      data: {
        function: functionName as `${string}::${string}::${string}`,
        functionArguments: args,
      },
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: this.localAccount,
      transaction,
    });

    return committedTxn.hash;
  }

  private async executeWithWallet(functionName: string, args: any[]): Promise<string> {
    if (!this.wallet?.signAndSubmitTransaction) {
      throw new Error('Wallet not available');
    }

    const response = await this.wallet.signAndSubmitTransaction({
      data: {
        function: functionName as `${string}::${string}::${string}`,
        functionArguments: args,
      },
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
    });

    return response.hash;
  }
}

// Universal transaction functions that work with both wallet and local accounts
export async function universalBuyUpgrade(
  currentAccount: any,
  wallet: any,
  accountType: 'wallet' | 'local' | null,
  manager: TransactionManager,
  upgradeId: number
): Promise<string> {
  const executor = new UniversalTransactionExecutor(currentAccount, wallet, accountType);
  const hash = await executor.executeTransaction(CONTRACT_FUNCTIONS.BUY_UPGRADE, [upgradeId]);
  
  const transactionId = `upgrade_${Date.now()}_${Math.random()}`;
  manager.addToQueue({
    id: transactionId,
    type: 'upgrade',
    status: 'submitted',
    hash: hash,
  });
  
  return hash;
}

export async function universalBuyAutoClicker(
  currentAccount: any,
  wallet: any,
  accountType: 'wallet' | 'local' | null,
  manager: TransactionManager,
  autoClickerId: number,
  quantity: number = 1
): Promise<string> {
  const executor = new UniversalTransactionExecutor(currentAccount, wallet, accountType);
  const hash = await executor.executeTransaction(CONTRACT_FUNCTIONS.BUY_AUTO_CLICKER, [autoClickerId, quantity]);
  
  const transactionId = `auto_clicker_${Date.now()}_${Math.random()}`;
  manager.addToQueue({
    id: transactionId,
    type: 'auto_clicker',
    status: 'submitted',
    hash: hash,
  });
  
  return hash;
}

export async function universalCollectPassive(
  currentAccount: any,
  wallet: any,
  accountType: 'wallet' | 'local' | null,
  manager: TransactionManager
): Promise<string> {
  const executor = new UniversalTransactionExecutor(currentAccount, wallet, accountType);
  const hash = await executor.executeTransaction(CONTRACT_FUNCTIONS.COLLECT_PASSIVE_COOKIES, []);
  
  const transactionId = `collect_passive_${Date.now()}_${Math.random()}`;
  manager.addToQueue({
    id: transactionId,
    type: 'collect_passive',
    status: 'submitted',
    hash: hash,
  });
  
  return hash;
}

export async function universalPrestige(
  currentAccount: any,
  wallet: any,
  accountType: 'wallet' | 'local' | null,
  manager: TransactionManager
): Promise<string> {
  const executor = new UniversalTransactionExecutor(currentAccount, wallet, accountType);
  const hash = await executor.executeTransaction(CONTRACT_FUNCTIONS.PRESTIGE, []);
  
  const transactionId = `prestige_${Date.now()}_${Math.random()}`;
  manager.addToQueue({
    id: transactionId,
    type: 'prestige',
    status: 'submitted',
    hash: hash,
  });
  
  return hash;
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
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
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
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
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
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
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
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
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
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
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
        options: {
            replayProtectionNonce: Math.floor(Math.random() * 1000000),
        }
    },
  };

  return submitTransaction(wallet, transactionData, manager, 'prestige');
}