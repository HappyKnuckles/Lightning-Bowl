import { Injectable } from '@angular/core';
import { AdMob, AdmobConsentStatus, AdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';

@Injectable({
  providedIn: 'root',
})
export class AdService {
  constructor() {
    this.init();
  }

  async init() {
    await this.initializeAdMob();
  }

  async initializeAdMob() {
    await AdMob.initialize();

    const [trackingInfo, consentInfo] = await Promise.all([AdMob.trackingAuthorizationStatus(), AdMob.requestConsentInfo()]);

    if (trackingInfo.status === 'notDetermined') {
      /**
       * If you want to explain TrackingAuthorization before showing the iOS dialog,
       * you can show the modal here.
       * ex)
       * const modal = await this.modalCtrl.create({
       *   component: RequestTrackingPage,
       * });
       * await modal.present();
       * await modal.onDidDismiss();  // Wait for close modal
       **/

      await AdMob.requestTrackingAuthorization();
    }

    const authorizationStatus = await AdMob.trackingAuthorizationStatus();
    if (authorizationStatus.status === 'authorized' && consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
  }

  async showIntertistalAd() {
    const options: AdOptions = {
      // adId: 'ca-app-pub-5244538287702059/5612009313',
      adId: 'ca-app-pub-3940256099942544/1033173712',
      isTesting: true, // Remove this line when you are ready to go live
    };

    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
  }

  async showRewardedAd(): Promise<void> {
    const options: AdOptions = {
      // adId: 'ca-app-pub-5244538287702059/1758897353'
      adId: 'ca-app-pub-3940256099942544/5224354917', // Replace with your Ad Unit ID
      isTesting: true, // Remove this line when you are ready to go live
    };

    try {
      await AdMob.prepareRewardVideoAd(options);

      return new Promise((resolve, reject) => {
        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
          console.error(error);
          reject(new Error('Ad not watched'));
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
          console.error(error);
          reject(new Error('Ad not watched'));
        });

        AdMob.addListener(RewardAdPluginEvents.Showed, () => {
          resolve();
        });

        AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          // User watched the ad and should be rewarded
          resolve();
        });

        AdMob.showRewardVideoAd().catch((error) => {
          console.error(error);
          reject(new Error('Ad not watched'));
        });
      });
    } catch (error) {
      console.error('Error preparing reward video ad:', error);
      throw new Error('Ad preparation failed');
    }
  }
}
