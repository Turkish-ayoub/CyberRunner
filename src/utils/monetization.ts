/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cyber Runner - Unified Monetization Bridge
 * Re-exports the unified AdManager and backward-compatible helper functions
 * for Google H5 Ads, Monetag, Adsterra, CrazyGames, and Poki SDKs.
 */

import { gameAdManager, AdManager, COIN_TIERS_CONFIG } from './adManager';

export { gameAdManager, AdManager, COIN_TIERS_CONFIG };

export const playRewardedAd = (options?: {
  rewardName?: string;
  durationSeconds?: number;
  onStart?: () => void;
  onReward?: () => void;
  onClose?: () => void;
}): Promise<boolean> => {
  options?.onStart?.();
  return gameAdManager.watchMultipleRewardedAds(1, () => {
    options?.onReward?.();
  }, {
    rewardTitle: options?.rewardName || 'Bonus Reward',
  }).then((res) => {
    options?.onClose?.();
    return res;
  });
};

export const playInterstitialAd = (options?: {
  force?: boolean;
  onCompleted?: () => void;
}): void => {
  if (options?.force) {
    gameAdManager.showInterstitialAd(options?.onCompleted);
  } else {
    gameAdManager.handleGameOver(options?.onCompleted);
  }
};

export const shouldPlayInterstitial = (): boolean => {
  return gameAdManager.cooldownRemaining === 0;
};

export const initMonetizationSDK = (): void => {
  gameAdManager.initSDKs();
};
