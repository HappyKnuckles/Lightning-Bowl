import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

enum SpareNames {
  BigFour = 'Big Four',
  GreekChurch = 'Greek Church',
  GoalPost = 'Goal Posts',
  Washout = 'Washout',
  Bucket = 'Bucket',
  BabySplit = 'Baby Split',
  DimeStore = 'Dime Store',
}

@Component({
  selector: 'app-spare-names',
  standalone: true,
  imports: [IonButton, NgFor, NgIf],
  templateUrl: './spare-names.component.html',
  styleUrl: './spare-names.component.scss',
})
export class SpareNamesComponent {
  selectedPins: number[] = [];

  get displayedNames(): string {
    return [...this.selectedPins].sort((a, b) => a - b).join('-');
  }

  get spareName(): string {
    const pins = [...this.selectedPins].sort((a, b) => a - b);

    if (this.isBigFour(pins)) {
      return SpareNames.BigFour;
    } else if (this.isGreekChurch(pins)) {
      return SpareNames.GreekChurch;
    } else if (this.isGoalPost(pins)) {
      return SpareNames.GoalPost;
    } else if (this.isBucket(pins)) {
      return SpareNames.Bucket;
    } else if (this.isBabySplit(pins)) {
      return SpareNames.BabySplit;
    } else if (this.isDimeStore(pins)) {
      return SpareNames.DimeStore;
    }

    return '';
  }

  togglePin(pin: number): void {
    if (this.selectedPins.includes(pin)) {
      this.selectedPins = this.selectedPins.filter((p) => p !== pin);
    } else {
      this.selectedPins.push(pin);
    }
  }

  private isBucket(pins: number[]): boolean {
    return JSON.stringify(pins) === JSON.stringify([2, 4, 5, 8]) || JSON.stringify(pins) === JSON.stringify([3, 5, 6, 9]);
  }

  private isBigFour(pins: number[]): boolean {
    return JSON.stringify(pins) === JSON.stringify([4, 6, 7, 10]);
  }

  private isGreekChurch(pins: number[]): boolean {
    return JSON.stringify(pins) === JSON.stringify([4, 6, 7, 8, 10]) || JSON.stringify(pins) === JSON.stringify([4, 6, 7, 9, 10]);
  }

  private isBabySplit(pins: number[]): boolean {
    return JSON.stringify(pins) === JSON.stringify([3, 10]) || JSON.stringify(pins) === JSON.stringify([2, 7]);
  }

  private isDimeStore(pins: number[]): boolean {
    return JSON.stringify(pins) === JSON.stringify([5, 10]) || JSON.stringify(pins) === JSON.stringify([5, 7]);
  }

  private isGoalPost(pins: number[]): boolean {
    return JSON.stringify(pins) === JSON.stringify([7, 10]);
  }
}
