import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Configuration for different networks
const NETWORK = Network.TESTNET; // Change to MAINNET for production
const MODULE_ADDRESS = "0xda81e838661e2e314b08c09efd26db04c529e02e26359bdafd3ad6fff81489d7"; // This should match your deployed contract address

export const aptosConfig = new AptosConfig({ 
  network: NETWORK,
});

export const aptos = new Aptos(aptosConfig);

export const MODULE_NAME = "cookie_clicker";
export const FULL_MODULE_ADDRESS = `${MODULE_ADDRESS}::${MODULE_NAME}`;

// Contract function names
export const CONTRACT_FUNCTIONS = {
  INITIALIZE_PLAYER: `${FULL_MODULE_ADDRESS}::initialize_player`,
  CLICK_COOKIE: `${FULL_MODULE_ADDRESS}::click_cookie`,
  BUY_UPGRADE: `${FULL_MODULE_ADDRESS}::buy_upgrade`,
  BUY_AUTO_CLICKER: `${FULL_MODULE_ADDRESS}::buy_auto_clicker`,
  COLLECT_PASSIVE_COOKIES: `${FULL_MODULE_ADDRESS}::collect_passive_cookies`,
  PRESTIGE: `${FULL_MODULE_ADDRESS}::prestige`,
} as const;

// View function names
export const VIEW_FUNCTIONS = {
  GET_PLAYER_COOKIES: `${FULL_MODULE_ADDRESS}::get_player_cookies`,
  GET_PLAYER_STATS: `${FULL_MODULE_ADDRESS}::get_player_stats`,
  GET_PLAYER_UPGRADES: `${FULL_MODULE_ADDRESS}::get_player_upgrades`,
  GET_PLAYER_AUTO_CLICKERS: `${FULL_MODULE_ADDRESS}::get_player_auto_clickers`,
} as const;

// Game constants
export const GAME_CONSTANTS = {
  PRESTIGE_THRESHOLD: 1000000,
  UPGRADE_COSTS: [100, 1000, 10000], // Double Cursor, Golden Touch, Divine Finger
  UPGRADE_NAMES: ["Double Cursor", "Golden Touch", "Divine Finger"],
  UPGRADE_DESCRIPTIONS: [
    "Double your clicking power! (2x multiplier)",
    "Turn clicks to gold! (5x multiplier)",
    "Divine clicking power! (10x multiplier)"
  ],
  UPGRADE_MULTIPLIERS: [2, 5, 10],
  
  AUTO_CLICKER_COSTS: [50, 500, 5000], // Grandma, Factory, Bank
  AUTO_CLICKER_NAMES: ["Grandma", "Factory", "Bank"],
  AUTO_CLICKER_DESCRIPTIONS: [
    "Grandma bakes cookies for you (1 cookie/sec)",
    "Cookie factory produces cookies (10 cookies/sec)",
    "Cookie bank generates interest (100 cookies/sec)"
  ],
  AUTO_CLICKER_RATES: [1, 10, 100],
} as const;

export type GameStats = {
  totalCookies: number;
  clickMultiplier: number;
  cookiesPerSecond: number;
  prestigeLevel: number;
};

export type PlayerUpgrades = boolean[];
export type PlayerAutoClickers = number[];