import { Account, Ed25519PrivateKey, AccountAddress, Aptos } from '@aptos-labs/ts-sdk';

export interface LocalAccountData {
  privateKey: string;
  address: string;
  publicKey: string;
  created: number;
  funded: boolean;
  initialized: boolean;
}

export class LocalAccountManager {
  private static readonly STORAGE_KEY = 'cookie_clicker_local_account';
  private account: Account | null = null;
  private accountData: LocalAccountData | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Generate a new local account and store it
   */
  generateNewAccount(): LocalAccountData {
    const privateKey = Ed25519PrivateKey.generate();
    const account = Account.fromPrivateKey({ privateKey });
    
    const accountData: LocalAccountData = {
      privateKey: privateKey.toString(),
      address: account.accountAddress.toString(),
      publicKey: account.publicKey.toString(),
      created: Date.now(),
      funded: false,
      initialized: false,
    };

    this.account = account;
    this.accountData = accountData;
    this.saveToStorage();

    return accountData;
  }

  /**
   * Load account from local storage
   */
  private loadFromStorage(): LocalAccountData | null {
    try {
      const stored = localStorage.getItem(LocalAccountManager.STORAGE_KEY);
      if (!stored) return null;

      const accountData: LocalAccountData = JSON.parse(stored);
      
      // Recreate Account object from private key
      const privateKey = new Ed25519PrivateKey(accountData.privateKey);
      this.account = Account.fromPrivateKey({ privateKey });
      this.accountData = accountData;

      return accountData;
    } catch (error) {
      console.error('Failed to load local account:', error);
      return null;
    }
  }

  /**
   * Save account to local storage
   */
  private saveToStorage(): void {
    if (!this.accountData) return;
    
    try {
      localStorage.setItem(
        LocalAccountManager.STORAGE_KEY, 
        JSON.stringify(this.accountData)
      );
    } catch (error) {
      console.error('Failed to save local account:', error);
    }
  }

  /**
   * Get current account data
   */
  getAccountData(): LocalAccountData | null {
    return this.accountData;
  }

  /**
   * Get current account object
   */
  getAccount(): Account | null {
    return this.account;
  }

  /**
   * Check if account exists
   */
  hasAccount(): boolean {
    return this.account !== null && this.accountData !== null;
  }

  /**
   * Mark account as funded
   */
  markFunded(): void {
    if (this.accountData) {
      this.accountData.funded = true;
      this.saveToStorage();
    }
  }

  /**
   * Mark account as initialized
   */
  markInitialized(): void {
    if (this.accountData) {
      this.accountData.initialized = true;
      this.saveToStorage();
    }
  }

  /**
   * Export account data for backup
   */
  exportAccount(): string {
    if (!this.accountData) {
      throw new Error('No account to export');
    }

    return JSON.stringify({
      ...this.accountData,
      exportedAt: Date.now(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import account from backup
   */
  importAccount(accountJson: string): LocalAccountData {
    try {
      const importedData = JSON.parse(accountJson);
      
      // Validate required fields
      if (!importedData.privateKey || !importedData.address) {
        throw new Error('Invalid account data: missing private key or address');
      }

      // Recreate Account object to validate
      const privateKey = new Ed25519PrivateKey(importedData.privateKey);
      const account = Account.fromPrivateKey({ privateKey });
      
      // Verify address matches
      if (account.accountAddress.toString() !== importedData.address) {
        throw new Error('Invalid account data: address mismatch');
      }

      const accountData: LocalAccountData = {
        privateKey: importedData.privateKey,
        address: importedData.address,
        publicKey: importedData.publicKey || account.publicKey.toString(),
        created: importedData.created || Date.now(),
        funded: importedData.funded || false,
        initialized: importedData.initialized || false,
      };

      this.account = account;
      this.accountData = accountData;
      this.saveToStorage();

      return accountData;
    } catch (error) {
      throw new Error(`Failed to import account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete local account
   */
  deleteAccount(): void {
    this.account = null;
    this.accountData = null;
    localStorage.removeItem(LocalAccountManager.STORAGE_KEY);
  }

  /**
   * Get account balance (requires aptos client)
   */
  async getBalance(aptosClient: Aptos): Promise<number> {
    if (!this.account) {
      throw new Error('No account available');
    }

    try {
        return await aptosClient.account.getAccountAPTAmount({accountAddress: this.account.accountAddress});
    } catch (error) {
      // Account might not exist yet
      return 0;
    }
  }

  /**
   * Generate a funding address QR code or link
   */
  getFundingInfo(): { address: string; explorerUrl: string } | null {
    if (!this.accountData) return null;

    return {
      address: this.accountData.address,
      explorerUrl: `https://explorer.aptoslabs.com/account/${this.accountData.address}?network=testnet`
    };
  }
}

// Singleton instance
export const localAccountManager = new LocalAccountManager();
