import { Injectable } from '@angular/core';
import { LeaveStats } from 'src/app/core/models/stats.model';
import { Game } from 'src/app/core/models/game.model';

@Injectable({
  providedIn: 'root',
})
export class PinStatsCalculatorService {
  calculateLeaveStats(games: Game[]): LeaveStats[] {
    const pinModeGames = games.filter((game) => game.isPinMode);
    const leaveMap = new Map<string, { pins: number[]; occurrences: number; pickups: number }>();

    pinModeGames.forEach((game) => {
      game.frames.forEach((frame, idx: number) => {
        if (frame.throws && frame.throws.length > 0) {
          const firstThrow = frame.throws[0];

          // Check first throw (not a strike)
          if (firstThrow && firstThrow.value !== 10 && firstThrow.pinsLeftStanding) {
            const pinsLeft = [...firstThrow.pinsLeftStanding].sort((a: number, b: number) => a - b);
            const key = pinsLeft.join(',');

            if (!leaveMap.has(key)) {
              leaveMap.set(key, { pins: pinsLeft, occurrences: 0, pickups: 0 });
            }

            const leave = leaveMap.get(key)!;
            leave.occurrences++;

            // Check if spare was made
            const secondThrow = frame.throws[1];
            if (secondThrow && firstThrow.value + secondThrow.value === 10) {
              leave.pickups++;
            }
          }

          // Check 10th frame second throw if first was strike
          if (idx === 9 && firstThrow && firstThrow.value === 10 && frame.throws[1]) {
            const secondThrow = frame.throws[1];
            if (secondThrow && secondThrow.value !== 10 && secondThrow.pinsLeftStanding) {
              const pinsLeft = [...secondThrow.pinsLeftStanding].sort((a: number, b: number) => a - b);
              const key = pinsLeft.join(',');

              if (!leaveMap.has(key)) {
                leaveMap.set(key, { pins: pinsLeft, occurrences: 0, pickups: 0 });
              }

              const leave = leaveMap.get(key)!;
              leave.occurrences++;

              // Check if spare was made
              const thirdThrow = frame.throws[2];
              if (thirdThrow && secondThrow.value + thirdThrow.value === 10) {
                leave.pickups++;
              }
            }
          }
        }
      });
    });

    const leavesArray: LeaveStats[] = Array.from(leaveMap.values()).map((leave) => ({
      ...leave,
      pickupPercentage: leave.occurrences > 0 ? (leave.pickups / leave.occurrences) * 100 : 0,
    }));

    return leavesArray.sort((a, b) => b.occurrences - a.occurrences).slice(0, 10);
  }
}
