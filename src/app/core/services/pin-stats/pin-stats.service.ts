import { Injectable } from '@angular/core';
import { PinData, FrameWithPins, Game } from '../../models/game.model';

interface SplitInfo {
  isSplit: boolean;
  splitName?: string;
  pinsInvolved: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PinStatsService {

  constructor() { }

  /**
   * Determines if a pin configuration represents a split
   */
  detectSplit(standingPins: number[]): SplitInfo {
    const standing = standingPins.filter(pin => pin >= 1 && pin <= 10).sort((a, b) => a - b);
    
    if (standing.length < 2) {
      return { isSplit: false, pinsInvolved: standing };
    }

    // If head pin (1) is still standing, it's not a split
    if (standing.includes(1)) {
      return { isSplit: false, pinsInvolved: standing };
    }

    // Define adjacent pin relationships in bowling
    const adjacentPairs = new Map<number, number[]>([
      [1, [2, 3]],
      [2, [1, 3, 4, 5]],
      [3, [1, 2, 5, 6]],
      [4, [2, 5, 7, 8]],
      [5, [2, 3, 4, 6, 8, 9]],
      [6, [3, 5, 9, 10]],
      [7, [4, 8]],
      [8, [4, 5, 7, 9]],
      [9, [5, 6, 8, 10]],
      [10, [6, 9]]
    ]);

    // Check if any standing pins are adjacent
    for (let i = 0; i < standing.length - 1; i++) {
      for (let j = i + 1; j < standing.length; j++) {
        const pin1 = standing[i];
        const pin2 = standing[j];
        if (adjacentPairs.get(pin1)?.includes(pin2)) {
          return { isSplit: false, pinsInvolved: standing };
        }
      }
    }

    // It's a split! Determine the split name
    const splitName = this.getSplitName(standing);
    return { 
      isSplit: true, 
      splitName, 
      pinsInvolved: standing 
    };
  }

  /**
   * Gets the common name for a split configuration
   */
  private getSplitName(pins: number[]): string {
    const sortedPins = [...pins].sort((a, b) => a - b);
    const pinString = sortedPins.join('-');

    const splitNames: { [key: string]: string } = {
      '7-10': '7-10 Split (Bedposts)',
      '4-6': '4-6 Split',
      '6-7': '6-7 Split',
      '8-10': '8-10 Split',
      '4-10': '4-10 Split',
      '6-10': '6-10 Split',
      '7-9': '7-9 Split',
      '4-7-10': '4-7-10 Split',
      '6-7-10': '6-7-10 Split',
      '4-6-7-10': 'Big Four',
      '2-7': 'Baby Split (Left)',
      '3-10': 'Baby Split (Right)',
      '2-4-5-8': 'Bucket (Left)',
      '3-5-6-9': 'Bucket (Right)',
      '4-6-7-8-10': 'Greek Church (Left)',
      '4-6-7-9-10': 'Greek Church (Right)',
      '5-7': 'Dime Store (Left)',
      '5-10': 'Dime Store (Right)'
    };

    return splitNames[pinString] || `${pinString} Split`;
  }

  /**
   * Calculates per-pin hit and miss statistics from games with pin data
   */
  calculatePinStatistics(games: Game[]): {
    pinHitCounts: number[];
    pinMissCounts: number[];
    pinHitPercentages: number[];
    totalSplits: number;
    splitsConverted: number;
    splitsMissed: number;
    splitConversionPercentage: number;
    splitTypes: { [key: string]: number };
  } {
    const pinHitCounts = Array(11).fill(0); // 0-10, pin 0 unused
    const pinMissCounts = Array(11).fill(0); // 0-10, pin 0 unused
    const splitTypes: { [key: string]: number } = {};
    let totalSplits = 0;
    let splitsConverted = 0;

    // Process games that have pin-level data
    games.forEach(game => {
      if (!this.hasDetailedPinData(game)) {
        return;
      }

      game.frames.forEach((frame: FrameWithPins, frameIndex: number) => {
        if (!frame.throws || frame.throws.length === 0) return;

        let availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        frame.throws.forEach((throw_, throwIndex) => {
          if (!throw_.pins) return;

          // Track hits
          throw_.pins.pinsKnocked.forEach(pin => {
            if (pin >= 1 && pin <= 10) {
              pinHitCounts[pin]++;
            }
          });

          // For second throw, check if it was a split situation
          if (throwIndex === 1 && availablePins.length < 10) {
            const splitInfo = this.detectSplit(availablePins);
            if (splitInfo.isSplit) {
              totalSplits++;
              const splitName = splitInfo.splitName || splitInfo.pinsInvolved.join('-');
              splitTypes[splitName] = (splitTypes[splitName] || 0) + 1;

              // Check if split was converted (all standing pins knocked down)
              const allStandingKnocked = availablePins.every(pin => 
                throw_.pins!.pinsKnocked.includes(pin)
              );
              if (allStandingKnocked) {
                splitsConverted++;
              }
            }
          }

          // Update available pins for next throw
          availablePins = availablePins.filter(pin => 
            !throw_.pins!.pinsKnocked.includes(pin)
          );
        });

        // Track misses for pins that were available but not hit in any throw
        availablePins.forEach(pin => {
          if (pin >= 1 && pin <= 10) {
            pinMissCounts[pin]++;
          }
        });
      });
    });

    // Calculate percentages
    const pinHitPercentages = Array(11).fill(0);
    for (let pin = 1; pin <= 10; pin++) {
      const totalOpportunities = pinHitCounts[pin] + pinMissCounts[pin];
      pinHitPercentages[pin] = totalOpportunities > 0 
        ? (pinHitCounts[pin] / totalOpportunities) * 100 
        : 0;
    }

    const splitsMissed = totalSplits - splitsConverted;
    const splitConversionPercentage = totalSplits > 0 
      ? (splitsConverted / totalSplits) * 100 
      : 0;

    return {
      pinHitCounts,
      pinMissCounts,
      pinHitPercentages,
      totalSplits,
      splitsConverted,
      splitsMissed,
      splitConversionPercentage,
      splitTypes
    };
  }

  /**
   * Checks if a game has detailed pin-level data
   */
  private hasDetailedPinData(game: Game): boolean {
    if (!game.frames || !Array.isArray(game.frames)) {
      return false;
    }

    return game.frames.some((frame: any) => 
      frame.throws && 
      Array.isArray(frame.throws) &&
      frame.throws.some((throw_: any) => throw_.pins && throw_.pins.pinsKnocked)
    );
  }
}
