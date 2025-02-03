import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import Fuse from 'fuse.js';
import { Ball } from 'src/app/models/ball.model';
import { IonContent, IonSearchbar, IonList, IonItem, IonAvatar, IonImg, IonLabel, IonHeader, IonToolbar, IonCheckbox } from "@ionic/angular/standalone";
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-ball-combo-box',
  templateUrl: './ball-combo-box.component.html',
  styleUrls: ['./ball-combo-box.component.scss'],
  standalone: true,
  imports: [IonCheckbox, IonToolbar, IonHeader, IonLabel, IonImg, IonAvatar, IonItem, IonList, IonSearchbar, IonContent, IonContent, IonSearchbar, IonLabel, IonImg, IonAvatar, IonItem, IonList]
})
export class BallComboBoxComponent implements OnInit {
  url = 'https://bowwwl.com/';
  // TODO infinite scroll or else too slow
  @Input() balls: Ball[] = [];
  @Output() selectedBallsChange = new EventEmitter<Ball[]>();
  
  filteredBalls: Ball[] = [];
  fuse!: Fuse<Ball>;
  selectedBalls: Ball[] = [];
  constructor(private modalCtrl: ModalController) { }

  ngOnInit(): void {
    this.filteredBalls = this.balls;
    const options = {
      keys: [
        { name: 'ball_name', weight: 1 },
        { name: 'brand_name', weight: 0.9 },
        { name: 'core_name', weight: 0.7 },
        { name: 'coverstock_name', weight: 0.7 },
        { name: 'factory_finish', weight: 0.5 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 3,
      includeMatches: true,
      includeScore: true,
      shouldSort: true,
      useExtendedSearch: false,
    };
    this.fuse = new Fuse(this.balls, options);
  }

  isChecked(ball: Ball): boolean {
    return this.selectedBalls.includes(ball);
  }

  checkboxChange(event: CustomEvent): void {
    const checked = event.detail.checked;
    const value = event.detail.value;

    if (checked) {
      this.selectedBalls = [...this.selectedBalls, value];
    } else {
      this.selectedBalls = this.selectedBalls.filter((item) => item !== value);
    }
  }

  searchBalls(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm && searchTerm.trim() !== '') {
      const result = this.fuse.search(searchTerm);
      this.filteredBalls = result.map(res => res.item);
    } else {
      this.filteredBalls = this.balls;
    }
  }

  // does not work yet TODO
  ionViewWillLeave() {
    this.selectedBallsChange.emit(this.selectedBalls);
  }
}