/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Enterprise Monetization & Policy-Compliant Ad Architecture
 * Specializing in Google H5 Ads, Monetag, Adsterra, CrazyGames, and Poki SDKs.
 * 
 * Enforces strict frequency capping, async/await rewarded ad chains,
 * dynamic character test-drive pricing, and sound management.
 */

import { gameAudio } from './audio';
import { storage } from './storage';

// Global window declarations for major ad networks
declare global {
  interface Window {
    show_monetag_interstitial?: () => void;
    MonetagInterstitial?: {
      show: () => Promise<void>;
    };
    MonetagRewarded?: {
      show: () => Promise<void>;
    };
    CrazyGames?: {
      SDK?: {
        init?: () => Promise<void>;
        ad?: {
          requestAd: (
            type: 'rewarded' | 'midgame',
            callbacks?: {
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (error: any) => void;
            }
          ) => void;
        };
      };
    };
    PokiSDK?: {
      init?: () => Promise<void>;
      commercialBreak?: () => Promise<void>;
      rewardedBreak?: () => Promise<boolean>;
      gameplayStart?: () => void;
      gameplayStop?: () => void;
    };
    adBreak?: (options: {
      type: 'next' | 'reward' | 'start' | 'pause' | 'browse';
      name?: string;
      beforeAd?: () => void;
      afterAd?: () => void;
      adBreakDone?: (placementInfo: any) => void;
      beforeReward?: (showAdFn: () => void) => void;
      adDismissed?: () => void;
      adViewed?: () => void;
    }) => void;
    adConfig?: (options: any) => void;
  }
}

export interface AdProgressState {
  currentAd: number;
  totalAds: number;
  adTitle: string;
  adSubtitle: string;
  rewardDescription: string;
}

export interface CoinRewardConfig {
  ads: number;
  coins: number;
  title: string;
  subtitle: string;
}

export const COIN_TIERS_CONFIG: Record<number, CoinRewardConfig> = {
  1: { ads: 1, coins: 300, title: 'Standard Sponsor Broadcast', subtitle: '1 Quick Ad Stream' },
  2: { ads: 2, coins: 800, title: 'Double Sponsor Pipeline', subtitle: '2 Sequential Ad Streams' },
  3: { ads: 3, coins: 1500, title: 'Mega Cyber Network Relay', subtitle: '3 Consecutive Ad Streams' },
};

export class AdManager {
  private retryCount: number = 0;
  private isAdShowing: boolean = false;
  private lastInterstitialTime: number = 0;
  private readonly COOLDOWN_MS: number = 120000; // 2 Minutes Cooldown to satisfy AdSense & CPM rules
  private activeCancelFn: (() => void) | null = null;

  constructor() {
    this.initSDKs();
  }

  /**
   * Initializes any active web game SDKs
   */
  public initSDKs(): void {
    if (typeof window === 'undefined') return;

    // 1. CrazyGames SDK
    if (window.CrazyGames?.SDK?.init) {
      try {
        window.CrazyGames.SDK.init().catch((err) => {
          console.warn('[AdManager] CrazyGames SDK init error:', err);
        });
      } catch (e) {
        console.warn('[AdManager] CrazyGames SDK error:', e);
      }
    }

    // 2. Poki SDK
    if (window.PokiSDK?.init) {
      try {
        window.PokiSDK.init().catch((err) => {
          console.warn('[AdManager] PokiSDK init error:', err);
        });
      } catch (e) {
        console.warn('[AdManager] PokiSDK error:', e);
      }
    }
  }

  public get isShowing(): boolean {
    return this.isAdShowing;
  }

  public get cooldownRemaining(): number {
    const elapsed = Date.now() - this.lastInterstitialTime;
    return Math.max(0, Math.ceil((this.COOLDOWN_MS - elapsed) / 1000));
  }

  // =========================================================================
  // 1. GAME OVER INTERSTITIALS (Strict Policy Compliant Frequency Capping)
  // =========================================================================
  /**
   * Handles Game-Over cycle with strict frequency capping & cooldown timer.
   * Only triggers 1 ad every 2 retries AND enforces a 120s cooldown.
   */
  public handleGameOver(onAdClosed?: () => void): boolean {
    this.retryCount++;
    const now = Date.now();
    const isRetryCycleMet = this.retryCount % 2 === 0;
    const isCooldownElapsed = (now - this.lastInterstitialTime) > this.COOLDOWN_MS;

    console.log(
      `[AdManager] Game Over #${this.retryCount}. Frequency Met: ${isRetryCycleMet}, Cooldown Elapsed: ${isCooldownElapsed} (${this.cooldownRemaining}s remaining)`
    );

    if (isRetryCycleMet && isCooldownElapsed) {
      this.showInterstitialAd(onAdClosed);
      this.lastInterstitialTime = now;
      return true;
    }

    onAdClosed?.();
    return false;
  }

  /**
   * Dispatches midgame/interstitial ad across supported ad networks with graceful fallback
   */
  public showInterstitialAd(onCompleted?: () => void): void {
    if (this.isAdShowing) {
      onCompleted?.();
      return;
    }

    this.isAdShowing = true;
    const wasBgmPlaying = gameAudio.isSoundEnabled();
    gameAudio.stopBGM();

    const finishAd = () => {
      this.isAdShowing = false;
      if (wasBgmPlaying) {
        // Keep BGM stopped until next game start or resume
      }
      onCompleted?.();
    };

    // 1. Google H5 Ads / AdSense for Games (adBreak)
    if (typeof window.adBreak === 'function') {
      try {
        window.adBreak({
          type: 'next',
          name: 'gameover_interstitial',
          beforeAd: () => {
            console.log('[AdManager] Google H5 Ad starting...');
          },
          afterAd: () => {
            console.log('[AdManager] Google H5 Ad finished');
            finishAd();
          },
          adBreakDone: () => {
            finishAd();
          },
        });
        return;
      } catch (err) {
        console.warn('[AdManager] Google H5 adBreak error:', err);
      }
    }

    // 2. Monetag Interstitial
    if (typeof window.show_monetag_interstitial === 'function') {
      try {
        window.show_monetag_interstitial();
        setTimeout(finishAd, 1200);
        return;
      } catch (err) {
        console.warn('[AdManager] Monetag interstitial error:', err);
      }
    } else if (window.MonetagInterstitial?.show) {
      window.MonetagInterstitial.show()
        .then(() => finishAd())
        .catch(() => finishAd());
      return;
    }

    // 3. CrazyGames SDK
    if (window.CrazyGames?.SDK?.ad?.requestAd) {
      try {
        window.CrazyGames.SDK.ad.requestAd('midgame', {
          adStarted: () => {
            console.log('[AdManager] CrazyGames midgame ad started');
          },
          adFinished: () => {
            console.log('[AdManager] CrazyGames midgame ad finished');
            finishAd();
          },
          adError: (err) => {
            console.warn('[AdManager] CrazyGames ad error:', err);
            finishAd();
          },
        });
        return;
      } catch (err) {
        console.warn('[AdManager] CrazyGames requestAd error:', err);
      }
    }

    // 4. Poki SDK
    if (window.PokiSDK?.commercialBreak) {
      try {
        window.PokiSDK.gameplayStop?.();
        window.PokiSDK.commercialBreak()
          .then(() => {
            window.PokiSDK?.gameplayStart?.();
            finishAd();
          })
          .catch(() => {
            window.PokiSDK?.gameplayStart?.();
            finishAd();
          });
        return;
      } catch (err) {
        console.warn('[AdManager] Poki commercialBreak error:', err);
      }
    }

    // 5. Test Mode / Standalone Simulation
    console.log('[AdManager] [Test Mode] Interstitial Displayed Safely with policy compliance');
    this.renderSimulatedAdModal({
      type: 'INTERSTITIAL',
      currentAd: 1,
      totalAds: 1,
      rewardDescription: 'Midgame Sponsor Break',
      durationSeconds: 1.2,
      canCancel: false,
    }).then(() => {
      finishAd();
    });
  }

  // =========================================================================
  // 2. ASYNC REWARDED ADS CHAIN (Sequential Watcher)
  // =========================================================================
  /**
   * Executes sequential rewarded ads via Async/Await Promise chains.
   * If cancelled or interrupted prematurely: halts chain, alerts user, withholds reward.
   */
  public async watchMultipleRewardedAds(
    requiredAdsCount: number,
    onCompleteCallback: () => void,
    options?: {
      rewardTitle?: string;
      onProgress?: (current: number, total: number) => void;
      onError?: (message: string) => void;
    }
  ): Promise<boolean> {
    if (this.isAdShowing) {
      console.warn('[AdManager] An ad sequence is already active!');
      return false;
    }

    this.isAdShowing = true;
    const wasBgmPlaying = gameAudio.isSoundEnabled();
    gameAudio.stopBGM();

    let adsWatchedSuccessfully = 0;
    const title = options?.rewardTitle || 'Bonus Reward';

    try {
      for (let i = 1; i <= requiredAdsCount; i++) {
        options?.onProgress?.(i, requiredAdsCount);

        const success = await this.showSingleRewardedAd(i, requiredAdsCount, title);
        
        if (success) {
          adsWatchedSuccessfully++;
          gameAudio.playCoin();
        } else {
          // INTERRUPTED: Withhold reward, notify user, reset showing flag
          const errorMsg = `Ad sequence interrupted (${i - 1}/${requiredAdsCount} completed). Reward not granted.`;
          console.warn(`[AdManager] ${errorMsg}`);
          
          this.isAdShowing = false;
          this.showCyberAlertToast(errorMsg);
          options?.onError?.(errorMsg);
          return false;
        }
      }

      if (adsWatchedSuccessfully === requiredAdsCount) {
        this.isAdShowing = false;
        gameAudio.playCoin();
        onCompleteCallback();
        return true;
      }
    } catch (error) {
      console.error('[AdManager] Exception in watchMultipleRewardedAds:', error);
      this.isAdShowing = false;
      this.showCyberAlertToast('Ad transmission failed. Please check your network.');
      return false;
    } finally {
      this.isAdShowing = false;
      this.activeCancelFn = null;
    }

    return false;
  }

  /**
   * Handles a single rewarded ad in the chain via modern async promise
   */
  public showSingleRewardedAd(
    currentAdNumber: number,
    totalAdsRequired: number,
    rewardTitle: string = 'Cyber Reward'
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      console.log(`[AdManager] Displaying Ad ${currentAdNumber}/${totalAdsRequired} for "${rewardTitle}"...`);

      // 1. Google H5 Ads (adBreak type: 'reward')
      if (typeof window.adBreak === 'function') {
        try {
          window.adBreak({
            type: 'reward',
            name: `reward_chain_${currentAdNumber}_of_${totalAdsRequired}`,
            beforeReward: (showAdFn) => {
              showAdFn();
            },
            adDismissed: () => {
              // User skipped or closed early
              resolve(false);
            },
            adViewed: () => {
              // Completed
              resolve(true);
            },
            adBreakDone: (placementInfo) => {
              if (placementInfo?.breakStatus === 'viewed') {
                resolve(true);
              }
            },
          });
          return;
        } catch (err) {
          console.warn('[AdManager] Google H5 reward break error, falling back:', err);
        }
      }

      // 2. Monetag Rewarded
      if (window.MonetagRewarded?.show) {
        window.MonetagRewarded.show()
          .then(() => resolve(true))
          .catch(() => resolve(false));
        return;
      }

      // 3. CrazyGames SDK Rewarded
      if (window.CrazyGames?.SDK?.ad?.requestAd) {
        window.CrazyGames.SDK.ad.requestAd('rewarded', {
          adStarted: () => {
            console.log(`[AdManager] CrazyGames Rewarded ${currentAdNumber}/${totalAdsRequired} started`);
          },
          adFinished: () => {
            console.log(`[AdManager] CrazyGames Rewarded ${currentAdNumber}/${totalAdsRequired} finished`);
            resolve(true);
          },
          adError: (err) => {
            console.warn(`[AdManager] CrazyGames Rewarded ${currentAdNumber}/${totalAdsRequired} error:`, err);
            resolve(false);
          },
        });
        return;
      }

      // 4. Poki SDK Rewarded
      if (window.PokiSDK?.rewardedBreak) {
        window.PokiSDK.gameplayStop?.();
        window.PokiSDK.rewardedBreak()
          .then((rewarded) => {
            window.PokiSDK?.gameplayStart?.();
            resolve(Boolean(rewarded));
          })
          .catch(() => {
            window.PokiSDK?.gameplayStart?.();
            resolve(false);
          });
        return;
      }

      // 5. Test Mode Interactive Simulated Broadcast
      this.renderSimulatedAdModal({
        type: 'REWARDED',
        currentAd: currentAdNumber,
        totalAds: totalAdsRequired,
        rewardDescription: rewardTitle,
        durationSeconds: 1.4,
        canCancel: true,
      }).then((result) => {
        resolve(result);
      });
    });
  }

  // =========================================================================
  // 3. CHARACTER TEST-DRIVE & COIN PURCHASE HOOKS
  // =========================================================================
  /**
   * Character Trial Hook:
   * Dynamically calculates required ads: Every 10,000 Coins = 1 Rewarded Ad.
   * e.g., 40,000 Coin character -> 4 ads.
   */
  public trialCharacter(
    characterPrice: number,
    characterId: string,
    characterName: string,
    onSuccess: (charId: string) => void
  ): void {
    const requiredAds = Math.max(1, Math.ceil(characterPrice / 10000));
    
    console.log(
      `[AdManager] Starting test-drive ad sequence for ${characterName} (Price: ${characterPrice}). Required Ads: ${requiredAds}`
    );

    this.watchMultipleRewardedAds(
      requiredAds,
      () => {
        onSuccess(characterId);
      },
      {
        rewardTitle: `1-Run Trial for ${characterName}`,
      }
    );
  }

  /**
   * Coin Purchase Hook:
   * Tier 1 (1 Ad = 300 Coins), Tier 2 (2 Ads = 800 Coins), Tier 3 (3 Ads = 1500 Coins)
   */
  public buyCoinsWithAds(
    tier: number,
    onSuccess: (coinsEarned: number) => void
  ): void {
    const selected = COIN_TIERS_CONFIG[tier];
    if (!selected) {
      console.error(`[AdManager] Invalid coin tier: ${tier}`);
      return;
    }

    console.log(`[AdManager] Purchasing Tier ${tier} (${selected.coins} coins) for ${selected.ads} ads.`);

    this.watchMultipleRewardedAds(
      selected.ads,
      () => {
        onSuccess(selected.coins);
      },
      {
        rewardTitle: `+${selected.coins.toLocaleString()} Golden Coins`,
      }
    );
  }

  // =========================================================================
  // 4. HIGH-TECH SIMULATED BROADCAST OVERLAY & TOAST NOTIFICATION
  // =========================================================================
  private renderSimulatedAdModal(config: {
    type: 'INTERSTITIAL' | 'REWARDED';
    currentAd: number;
    totalAds: number;
    rewardDescription: string;
    durationSeconds: number;
    canCancel: boolean;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const existing = document.getElementById('cyber-monetization-overlay');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      const overlay = document.createElement('div');
      overlay.id = 'cyber-monetization-overlay';
      overlay.className =
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl select-none font-mono text-white p-4 animate-fade-in pointer-events-auto';

      const isChain = config.totalAds > 1;
      const progressPercent = ((config.currentAd - 1) / config.totalAds) * 100;

      overlay.innerHTML = `
        <div class="max-w-md w-full bg-neutral-900/95 border-2 border-cyan-500/90 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.35)] text-center flex flex-col items-center gap-4 relative overflow-hidden">
          
          {/* Top Status Badge */}
          <div class="w-full flex items-center justify-between border-b border-neutral-800 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
              <span class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                ${config.type === 'REWARDED' ? '📡 REWARDED SPONSOR STREAM' : '⚡ SPONSOR INTERMISSION'}
              </span>
            </div>

            <span class="text-xs font-black text-yellow-400 bg-yellow-950/50 border border-yellow-500/40 px-2 py-0.5 rounded-md">
              AD ${config.currentAd}/${config.totalAds}
            </span>
          </div>

          {/* Reward Target Title */}
          <div class="space-y-1">
            <h3 class="text-base font-black text-white uppercase tracking-wider">
              ${config.rewardDescription}
            </h3>
            <p class="text-[11px] text-neutral-400">
              ${isChain ? `Sequential Chain: Step ${config.currentAd} of ${config.totalAds} streams.` : 'Streaming verified sponsor transmission...'}
            </p>
          </div>

          {/* Sponsor Visual Card */}
          <div class="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-cyan-500/10 to-yellow-500/10 animate-pulse"></div>
            
            <div class="relative z-10 flex flex-col items-center gap-1.5 text-center">
              <span class="text-xs font-black text-pink-400 tracking-widest uppercase">
                ${config.currentAd === 1 ? '🚀 NEO-TOKYO WARP ENGINES' : config.currentAd === 2 ? '⚡ CYBER-IONIC OVERCHARGE' : '🛡️ QUANTUM FORCEFIELD CORE'}
              </span>
              <p class="text-[11px] text-neutral-300 max-w-[280px] leading-snug">
                "Instant acceleration, sub-zero coolant efficiency & 300% sensor response."
              </p>
              <span class="text-[9px] text-neutral-500 tracking-wider uppercase mt-1">
                Google H5 Ads • Monetag • CrazyGames Verified Stream
              </span>
            </div>
          </div>

          {/* Progress & Countdown */}
          <div class="w-full space-y-2">
            <div class="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
              <span>Broadcast stream verifies in:</span>
              <span id="cyber-ad-timer" class="font-black text-cyan-400 text-sm">
                ${config.durationSeconds.toFixed(1)}s
              </span>
            </div>

            <div class="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
              <div id="cyber-ad-progress" class="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-75" style="width: 0%"></div>
            </div>
          </div>

          {/* Cancel Button (To simulate or test prematurely closing ads) */}
          ${config.canCancel ? `
            <div class="w-full pt-1 flex items-center justify-between gap-3">
              <button
                id="cyber-ad-cancel-btn"
                class="w-full py-2 rounded-xl bg-neutral-850 hover:bg-red-950/60 border border-neutral-700 hover:border-red-500 text-neutral-400 hover:text-red-400 text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer"
              >
                ✕ Cancel Stream (Withhold Reward)
              </button>
            </div>
          ` : ''}
        </div>
      `;

      document.body.appendChild(overlay);

      const timerEl = overlay.querySelector('#cyber-ad-timer');
      const progressEl = overlay.querySelector('#cyber-ad-progress') as HTMLElement | null;
      const cancelBtn = overlay.querySelector('#cyber-ad-cancel-btn');

      const startTime = performance.now();
      const totalMs = config.durationSeconds * 1000;
      let isResolved = false;

      const cleanup = () => {
        clearInterval(interval);
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          resolve(false); // Cancelled prematurely!
        });
      }

      const interval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, (totalMs - elapsed) / 1000);
        const percent = Math.min(100, (elapsed / totalMs) * 100);

        if (timerEl) {
          timerEl.textContent = `${remaining.toFixed(1)}s`;
        }
        if (progressEl) {
          progressEl.style.width = `${percent}%`;
        }

        if (elapsed >= totalMs) {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          resolve(true); // Completed successfully!
        }
      }, 40);
    });
  }

  /**
   * Renders a cyber-styled notification toast when an ad sequence is interrupted
   */
  public showCyberAlertToast(message: string): void {
    const existing = document.getElementById('cyber-alert-toast');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const toast = document.createElement('div');
    toast.id = 'cyber-alert-toast';
    toast.className =
      'fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-neutral-900/95 border-2 border-red-500/90 text-white font-mono px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center gap-3 animate-bounce select-none pointer-events-auto max-w-sm w-full mx-4';
    
    toast.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 font-black text-sm shrink-0">
        ⚠️
      </div>
      <div class="flex-1 text-left">
        <div class="text-[10px] font-black text-red-400 uppercase tracking-widest">TRANSMISSION NOTICE</div>
        <div class="text-xs text-neutral-200 font-bold leading-tight mt-0.5">${message}</div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4500);
  }
}

// Global Singleton Instance
export const gameAdManager = new AdManager();
