import { Component, input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonInput } from '@ionic/angular/standalone';
import { Game } from 'src/app/core/models/game.model';

@Component({
  selector: 'app-bowling-frame-display',
  templateUrl: './bowling-frame-display.component.html',
  styleUrls: ['./bowling-frame-display.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, IonGrid, IonRow, IonCol, IonInput],
})
export class BowlingFrameDisplayComponent {
  game = input.required<Game>();
  readonly = input<boolean>(true);
  showFrameScores = input<boolean>(true);
  currentFrameIndex = input<number | undefined>(undefined);
  currentThrowIndex = input<number>(0);
  showMaxScore = input<boolean>(false);
  maxScore = input<number>(300);

  isCurrentThrow(frameIndex: number, throwIndex: number): boolean {
    return this.currentFrameIndex() === frameIndex && this.currentThrowIndex() === throwIndex;
  }

  getFrameValue(frameIndex: number, throwIndex: number): string {
    const game = this.game();
    const frame = game.frames[frameIndex];

    if (!frame) {
      return '';
    }

    let val: number | undefined;

    if (frame.throws && frame.throws[throwIndex]) {
      val = frame.throws[throwIndex].value;
    } else if (Array.isArray(frame) && frame[throwIndex] !== undefined) {
      val = frame[throwIndex];
    } else {
      return '';
    }

    if (val === undefined || val === null) {
      return '';
    }

    const firstBall = frame.throws?.[0]?.value ?? frame[0];
    const secondBall = frame.throws?.[1]?.value ?? frame[1];
    const isTenth = frameIndex === 9;

    if (val === 0) {
      return '–';
    }

    if (throwIndex === 0) {
      return val === 10 ? 'X' : val.toString();
    }

    if (!isTenth) {
      if (firstBall !== undefined && firstBall !== 10 && firstBall + val === 10) {
        return '/';
      }
      return val.toString();
    }

    if (throwIndex === 1) {
      if (val === 10) {
        return 'X';
      }
      if (firstBall !== undefined && firstBall !== 10 && firstBall + val === 10) {
        return '/';
      }
      return val.toString();
    }

    if (throwIndex === 2) {
      if (val === 10) {
        return 'X';
      }
      if (firstBall === 10 && secondBall !== undefined && secondBall !== 10 && secondBall + val === 10) {
        return '/';
      }
      return val.toString();
    }

    return val.toString();
  }
}
