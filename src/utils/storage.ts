/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cyber Runner - High Performance LocalStorage Persistence Manager
 * Compatible with HTML5 Gaming Portals (CrazyGames, Poki, standalone WebGL)
 */

export interface GameSettings {
  soundEnabled: boolean;
  volume: number;
  language: string;
}

export interface PlayerInventory {
  hearts: number;
  shields: number;
  magnets: number;
  [key: string]: number;
}

// Storage Key Constants
const KEYS = {
  COINS: 'cyber_runner_coins',
  HIGHSCORE: 'cyber_runner_highscore',
  UNLOCKED_CHARS: 'cyber_runner_unlocked_chars',
  SELECTED_CHAR: 'cyber_runner_selected_char',
  IS_TRIAL: 'cyber_runner_is_trial',
  INVENTORY: 'cyber_runner_inventory',
  ACTIVE_MAP: 'cyber_runner_active_map',
  UNLOCKED_MAPS: 'cyber_runner_unlocked_maps',
  TOTAL_RUNS: 'cyber_runner_total_runs',
  GAMEOVER_COUNT: 'cyber_runner_gameover_count',
  SETTINGS: 'cyber_runner_settings',
  
  // Legacy migration keys
  LEGACY_HIGHSCORE: 'super_mario_3d_highscore',
  LEGACY_COINS: 'cyber_mario_total_coins',
  LEGACY_UNLOCKED_CHARS: 'cyber_mario_unlocked_characters',
  LEGACY_SELECTED_CHAR: 'cyber_mario_selected_character',
  LEGACY_IS_TRIAL: 'cyber_mario_is_temporary_trial',
  LEGACY_INVENTORY: 'cyber_mario_player_inventory',
  LEGACY_MAP: 'super_mario_3d_campaign_active_map',
  LEGACY_UNLOCKED_MAPS: 'super_mario_3d_campaign_unlocked',
};

class StorageManager {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
    this.migrateLegacyData();
  }

  private checkAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__cyber_runner_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getItem(key: string): string | null {
    if (!this.isAvailable) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to read key: ${key}`, e);
      return null;
    }
  }

  private setItem(key: string, value: string): void {
    if (!this.isAvailable) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to write key: ${key}`, e);
    }
  }

  private removeItem(key: string): void {
    if (!this.isAvailable) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove key: ${key}`, e);
    }
  }

  /**
   * Seamlessly migrates existing user data from previous builds to new IP-compliant keys
   */
  private migrateLegacyData(): void {
    if (!this.isAvailable) return;

    try {
      // Migrate High Score
      if (!this.getItem(KEYS.HIGHSCORE)) {
        const legacyHighScore = this.getItem(KEYS.LEGACY_HIGHSCORE);
        if (legacyHighScore) {
          this.setItem(KEYS.HIGHSCORE, legacyHighScore);
        }
      }

      // Migrate Coins (Golden Wallet)
      if (!this.getItem(KEYS.COINS)) {
        const legacyCoins = this.getItem(KEYS.LEGACY_COINS);
        if (legacyCoins) {
          this.setItem(KEYS.COINS, legacyCoins);
        }
      }

      // Migrate Unlocked Characters
      if (!this.getItem(KEYS.UNLOCKED_CHARS)) {
        const legacyChars = this.getItem(KEYS.LEGACY_UNLOCKED_CHARS);
        if (legacyChars) {
          this.setItem(KEYS.UNLOCKED_CHARS, legacyChars);
        }
      }

      // Migrate Selected Character
      if (!this.getItem(KEYS.SELECTED_CHAR)) {
        const legacySelected = this.getItem(KEYS.LEGACY_SELECTED_CHAR);
        if (legacySelected) {
          this.setItem(KEYS.SELECTED_CHAR, legacySelected);
        }
      }

      // Migrate Inventory
      if (!this.getItem(KEYS.INVENTORY)) {
        const legacyInv = this.getItem(KEYS.LEGACY_INVENTORY);
        if (legacyInv) {
          this.setItem(KEYS.INVENTORY, legacyInv);
        }
      }

      // Migrate Maps
      if (!this.getItem(KEYS.ACTIVE_MAP)) {
        const legacyMap = this.getItem(KEYS.LEGACY_MAP);
        if (legacyMap) {
          this.setItem(KEYS.ACTIVE_MAP, legacyMap);
        }
      }
      if (!this.getItem(KEYS.UNLOCKED_MAPS)) {
        const legacyMaps = this.getItem(KEYS.LEGACY_UNLOCKED_MAPS);
        if (legacyMaps) {
          this.setItem(KEYS.UNLOCKED_MAPS, legacyMaps);
        }
      }
    } catch (e) {
      console.warn('[Storage] Migration warning:', e);
    }
  }

  // --- GOLDEN WALLET (COINS) ---

  getCoins(): number {
    const val = this.getItem(KEYS.COINS);
    if (!val) return 0;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  setCoins(amount: number): void {
    const safeAmount = Math.max(0, Math.floor(amount));
    this.setItem(KEYS.COINS, safeAmount.toString());
    // Also keep legacy sync for safety
    this.setItem(KEYS.LEGACY_COINS, safeAmount.toString());
  }

  addCoins(amount: number): number {
    const next = this.getCoins() + Math.max(0, Math.floor(amount));
    this.setCoins(next);
    return next;
  }

  spendCoins(amount: number): boolean {
    const current = this.getCoins();
    if (current >= amount) {
      this.setCoins(current - amount);
      return true;
    }
    return false;
  }

  // --- HIGH SCORE ---

  getHighScore(): number {
    const val = this.getItem(KEYS.HIGHSCORE);
    if (!val) return 1245678; // Default initial target score
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 1245678 : parsed;
  }

  setHighScore(score: number): boolean {
    const current = this.getHighScore();
    if (score > current) {
      this.setItem(KEYS.HIGHSCORE, score.toString());
      this.setItem(KEYS.LEGACY_HIGHSCORE, score.toString());
      return true;
    }
    return false;
  }

  // --- CHARACTER ROSTER & SHOP ---

  getUnlockedCharacters(): string[] {
    const val = this.getItem(KEYS.UNLOCKED_CHARS);
    if (!val) return ['cyber_runner_red', 'red_mario'];
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        if (!parsed.includes('cyber_runner_red') && !parsed.includes('red_mario')) {
          parsed.push('cyber_runner_red');
        }
        return parsed;
      }
      return ['cyber_runner_red', 'red_mario'];
    } catch {
      return ['cyber_runner_red', 'red_mario'];
    }
  }

  setUnlockedCharacters(list: string[]): void {
    const json = JSON.stringify(list);
    this.setItem(KEYS.UNLOCKED_CHARS, json);
    this.setItem(KEYS.LEGACY_UNLOCKED_CHARS, json);
  }

  unlockCharacter(charId: string): string[] {
    const list = this.getUnlockedCharacters();
    if (!list.includes(charId)) {
      list.push(charId);
      const json = JSON.stringify(list);
      this.setItem(KEYS.UNLOCKED_CHARS, json);
      this.setItem(KEYS.LEGACY_UNLOCKED_CHARS, json);
    }
    return list;
  }

  isCharacterUnlocked(charId: string): boolean {
    if (charId === 'cyber_runner_red' || charId === 'red_mario') return true;
    return this.getUnlockedCharacters().includes(charId);
  }

  getSelectedCharacter(): string {
    const val = this.getItem(KEYS.SELECTED_CHAR);
    return val || 'cyber_runner_red';
  }

  setSelectedCharacter(charId: string): void {
    this.setItem(KEYS.SELECTED_CHAR, charId);
    this.setItem(KEYS.LEGACY_SELECTED_CHAR, charId);
  }

  isTemporaryTrial(): boolean {
    return this.getItem(KEYS.IS_TRIAL) === 'true' || this.getItem(KEYS.LEGACY_IS_TRIAL) === 'true';
  }

  setTemporaryTrial(isTrial: boolean): void {
    if (isTrial) {
      this.setItem(KEYS.IS_TRIAL, 'true');
      this.setItem(KEYS.LEGACY_IS_TRIAL, 'true');
    } else {
      this.removeItem(KEYS.IS_TRIAL);
      this.removeItem(KEYS.LEGACY_IS_TRIAL);
    }
  }

  // --- INVENTORY (CONSUMABLES) ---

  getInventory(): PlayerInventory {
    const val = this.getItem(KEYS.INVENTORY);
    const defaults: PlayerInventory = { hearts: 0, shields: 0, magnets: 0 };
    if (!val) return defaults;
    try {
      const parsed = JSON.parse(val);
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  }

  setInventory(inventory: PlayerInventory): void {
    const json = JSON.stringify(inventory);
    this.setItem(KEYS.INVENTORY, json);
    this.setItem(KEYS.LEGACY_INVENTORY, json);
  }

  addInventoryItem(itemKey: 'hearts' | 'shields' | 'magnets', count = 1): number {
    const inv = this.getInventory();
    inv[itemKey] = (inv[itemKey] || 0) + count;
    this.setInventory(inv);
    return inv[itemKey];
  }

  useInventoryItem(itemKey: 'hearts' | 'shields' | 'magnets'): boolean {
    const inv = this.getInventory();
    if ((inv[itemKey] || 0) > 0) {
      inv[itemKey] -= 1;
      this.setInventory(inv);
      return true;
    }
    return false;
  }

  // --- CAMPAIGN MAPS ---

  getActiveMap(): number {
    const val = this.getItem(KEYS.ACTIVE_MAP);
    if (!val) return 1;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 1 : parsed;
  }

  setActiveMap(mapId: number): void {
    this.setItem(KEYS.ACTIVE_MAP, mapId.toString());
    this.setItem(KEYS.LEGACY_MAP, mapId.toString());
  }

  getUnlockedMaps(): number[] {
    const val = this.getItem(KEYS.UNLOCKED_MAPS);
    if (!val) return [1];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [1];
    } catch {
      return [1];
    }
  }

  unlockMap(mapId: number): number[] {
    const list = this.getUnlockedMaps();
    if (!list.includes(mapId)) {
      list.push(mapId);
      const json = JSON.stringify(list);
      this.setItem(KEYS.UNLOCKED_MAPS, json);
      this.setItem(KEYS.LEGACY_UNLOCKED_MAPS, json);
    }
    return list;
  }

  // --- AD MONETIZATION CYCLE TRACKING ---

  getGameOverCount(): number {
    const val = this.getItem(KEYS.GAMEOVER_COUNT);
    if (!val) return 0;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  incrementGameOverCount(): number {
    const next = this.getGameOverCount() + 1;
    this.setItem(KEYS.GAMEOVER_COUNT, next.toString());
    return next;
  }

  resetGameOverCount(): void {
    this.setItem(KEYS.GAMEOVER_COUNT, '0');
  }

  // --- GENERAL SETTINGS ---

  getSettings(): GameSettings {
    const val = this.getItem(KEYS.SETTINGS);
    const defaults: GameSettings = { soundEnabled: true, volume: 0.7, language: 'en' };
    if (!val) return defaults;
    try {
      const parsed = JSON.parse(val);
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  }

  setSettings(settings: Partial<GameSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  }
}

export const storage = new StorageManager();
