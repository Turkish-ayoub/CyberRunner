/**
 * Poki SDK Integration Module
 * Commercial-grade publishing bridge for Poki game lifecycle, ads, and volume management.
 */

import { gameAudio } from './audio';

declare global {
  interface Window {
    PokiSDK?: {
      init: () => Promise<void>;
      gameLoadingStart?: () => void;
      gameLoadingFinished?: () => void;
      gameplayStart?: () => void;
      gameplayStop?: () => void;
      commercialBreak?: (customCallback?: () => void) => Promise<boolean | void>;
      rewardedBreak?: () => Promise<boolean>;
      setDebug?: (debug: boolean) => void;
    };
  }
}

class PokiSdkManager {
  private isInitialized: boolean = false;
  private isAdPlaying: boolean = false;
  private preAdSoundState: boolean = true;

  constructor() {
    this.initPoki();
  }

  public initPoki(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (this.isInitialized) return Promise.resolve();

    if (window.PokiSDK?.init) {
      return window.PokiSDK.init()
        .then(() => {
          this.isInitialized = true;
          console.log('[PokiSDK] Initialized successfully.');
          window.PokiSDK?.gameLoadingFinished?.();
        })
        .catch((err) => {
          console.warn('[PokiSDK] Init rejected or blocked (Adblocker active):', err);
          this.isInitialized = true;
          window.PokiSDK?.gameLoadingFinished?.();
        });
    } else {
      // Standalone / Test mode fallback
      this.isInitialized = true;
      return Promise.resolve();
    }
  }

  /**
   * Notifies Poki that active gameplay has started.
   * Call whenever the player launches a run, unpauses, or revives.
   */
  public gameplayStart(): void {
    if (typeof window === 'undefined') return;
    try {
      window.PokiSDK?.gameplayStart?.();
      console.log('[PokiSDK] gameplayStart invoked');
    } catch (e) {
      console.warn('[PokiSDK] gameplayStart error:', e);
    }
  }

  /**
   * Notifies Poki that active gameplay has stopped.
   * Call whenever the game is paused, over, or opening a menu/shop.
   */
  public gameplayStop(): void {
    if (typeof window === 'undefined') return;
    try {
      window.PokiSDK?.gameplayStop?.();
      console.log('[PokiSDK] gameplayStop invoked');
    } catch (e) {
      console.warn('[PokiSDK] gameplayStop error:', e);
    }
  }

  /**
   * Triggers a Poki commercial break (interstitial).
   * Automatically mutes sound during playback and restores sound afterwards.
   */
  public async commercialBreak(onComplete?: () => void): Promise<boolean> {
    if (this.isAdPlaying) {
      onComplete?.();
      return false;
    }

    this.isAdPlaying = true;
    this.gameplayStop();

    // Mute game audio for Poki QA compliance
    this.preAdSoundState = gameAudio.isSoundEnabled();
    gameAudio.setSoundEnabled(false);

    try {
      if (window.PokiSDK?.commercialBreak) {
        await window.PokiSDK.commercialBreak();
        console.log('[PokiSDK] Commercial break finished successfully.');
      } else {
        // Fallback test simulation
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.log('[PokiSDK Test Mode] Commercial break completed.');
      }
      return true;
    } catch (err) {
      console.warn('[PokiSDK] Commercial break error:', err);
      return false;
    } finally {
      // Restore sound
      gameAudio.setSoundEnabled(this.preAdSoundState);
      this.isAdPlaying = false;
      onComplete?.();
    }
  }

  /**
   * Triggers a Poki rewarded video break.
   * Resolves true if player watched to completion, false if skipped/failed.
   */
  public async rewardedBreak(): Promise<boolean> {
    if (this.isAdPlaying) return false;

    this.isAdPlaying = true;
    this.gameplayStop();

    // Mute game audio during rewarded video
    this.preAdSoundState = gameAudio.isSoundEnabled();
    gameAudio.setSoundEnabled(false);

    let success = false;
    try {
      if (window.PokiSDK?.rewardedBreak) {
        const result = await window.PokiSDK.rewardedBreak();
        success = !!result;
      } else {
        // Fallback test mode
        await new Promise((resolve) => setTimeout(resolve, 1000));
        success = true;
      }
    } catch (err) {
      console.warn('[PokiSDK] Rewarded break failed:', err);
      success = false;
    } finally {
      // Restore audio
      gameAudio.setSoundEnabled(this.preAdSoundState);
      this.isAdPlaying = false;
    }

    return success;
  }
}

export const pokiSdkManager = new PokiSdkManager();
