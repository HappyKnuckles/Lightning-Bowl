import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonCardHeader,
  IonCardContent,
  IonChip,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonSkeletonText,
  IonSearchbar,
  IonRefresherContent,
  IonText,
} from '@ionic/angular/standalone';
import { Pattern } from 'src/app/core/models/pattern.model';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/angular';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
// npm install chartjs-chart-matrix
// Chart.register(...registerables, MatrixController, MatrixElement);
// const LanePlugin = {
//   id: 'lanePlugin',
//   afterDraw(chart: Chart, _args: any, options: any) {
//     const { ctx, chartArea, scales } = chart;
//     if (!ctx) return;

//     // Lane outline
//     ctx.save();
//     ctx.strokeStyle = '#000';
//     ctx.lineWidth = 2;
//     ctx.strokeRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
//     ctx.restore();

//     // Draw pins at the top (above y=0)
//     // We treat y= -2 as "above" the lane so pins show up outside the chart area.
//     const pinCount = 10;
//     for (let i = 0; i < pinCount; i++) {
//       const xData = 10 + i * 2; // e.g. boards from 10..28
//       const yData = -2; // a bit above the lane
//       const xPx = scales.x.getPixelForValue(xData);
//       const yPx = scales.y.getPixelForValue(yData);

//       ctx.save();
//       ctx.beginPath();
//       ctx.fillStyle = '#666';
//       ctx.arc(xPx, yPx, 5, 0, 2 * Math.PI);
//       ctx.fill();
//       ctx.restore();
//     }
//   }
// };
@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.page.html',
  styleUrls: ['./pattern.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonRefresherContent,
    IonSearchbar,
    IonSkeletonText,
    IonRefresher,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonChip,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCard,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class PatternPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  patterns: Pattern[] = [];
  currentPage = 1;
  hasMoreData = true;

  constructor(
    private patternService: PatternService,
    private hapticService: HapticService,
    public loadingService: LoadingService,
    private toastService: ToastService,
  ) {}
  async ngOnInit() {
    await this.loadPatterns();
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      this.currentPage = 1;
      this.hasMoreData = true;
      this.patterns = [];
      await this.loadPatterns();
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.ballLoadError, 'bug', true);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
    }
  }

  async loadPatterns(event?: InfiniteScrollCustomEvent): Promise<void> {
    try {
      if (!event) {
        this.loadingService.setLoading(true);
      }
      const response = await this.patternService.getPatterns(this.currentPage);
      if (response.length > 0) {
        this.patterns = [...this.patterns, ...response];
        this.currentPage++;
      } else {
        this.hasMoreData = false;
      }
    } catch (error) {
      console.error('Error fetching balls:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      if (!event) {
        this.loadingService.setLoading(false);
      }
      if (event) {
        event.target.complete();
      }
    }
  }

  async searchPatterns(event: CustomEvent): Promise<void> {
    try {
      if (event.detail.value === '') {
        this.hasMoreData = true;
        await this.loadPatterns();
      } else {
        const response = await this.patternService.searchPattern(event.detail.value);
        this.patterns = response;
        this.hasMoreData = false;
        this.currentPage = 1;
      }
      this.content.scrollToTop(300);
    } catch (error) {
      console.error('Error searching patterns:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    }
  }

  formatDistance(distance: string | number): string {
    if (!distance) return '0';

    const distStr = String(distance);
    if (distStr.endsWith("'")) {
      return distStr.slice(0, -1) + 'ft';
    }

    return distStr;
  }

  getRatioValue(ratio: string): number {
    const numericPart = ratio.split(':')[0];
    return parseFloat(numericPart);
  }

  // createLaneChart(pattern: Pattern) {
  //   // Build matrix data
  //   const matrixData = this.buildLaneMatrix(pattern);

  //   // Grab a unique canvas per pattern
  //   const canvasId = `laneChart-${pattern.title}`;
  //   const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  //   if (!canvas) return;

  //   new Chart(canvas, {
  //     type: 'matrix',
  //     data: {
  //       datasets: [
  //         {
  //           label: 'Oil Distribution',
  //           data: matrixData, // array of {x, y, v}
  //           width: 10, // pixel width of each cell
  //           height: 4, // pixel height of each cell
  //           backgroundColor(ctx) {
  //             // Use v to color the cell
  //             const val = ctx.dataset.data[ctx.dataIndex].v;
  //             // You can scale or clamp val as needed
  //             const alpha = Math.min(val / 10, 1); // scale to [0..1]
  //             return `rgba(200,0,0,${alpha})`;
  //           }
  //         }
  //       ]
  //     },
  //     options: {
  //       responsive: false, // or true, but then might need a dynamic approach
  //       scales: {
  //         x: {
  //           type: 'linear',
  //           min: 0,
  //           max: 40, // 39 boards + 1 margin
  //           reverse: false, // boards left->right
  //           ticks: { stepSize: 5 },
  //           grid: { display: true }
  //         },
  //         y: {
  //           type: 'linear',
  //           min: 0,
  //           max: 60, // up to 60 feet
  //           reverse: true, // 0 at bottom
  //           ticks: { stepSize: 5 },
  //           grid: { display: true }
  //         }
  //       },
  //       plugins: {
  //         legend: { display: false },
  //         // Attach our custom plugin
  //         lanePlugin: {}
  //       }
  //     },
  //     plugins: [LanePlugin]
  //   });
  // }

  // /**
  //  * Merges forward + reverse data into a 2D matrix for boards [1..39]
  //  * and distance [0..some max], storing total oil in each cell.
  //  * Return an array of { x, y, v } for chartjs-chart-matrix.
  //  */
  // buildLaneMatrix(pattern: Pattern) {
  //   const matrix: Record<string, number> = {};

  //   // Helper to accumulate oil in matrix
  //   const accumulate = (board: number, dist: number, oil: number) => {
  //     const key = `${board},${dist}`;
  //     matrix[key] = (matrix[key] || 0) + oil;
  //   };

  //   // 1) Process forwards_data
  //   pattern.forwards_data.forEach(row => {
  //     const distStart = parseFloat(row.distance_start);
  //     const distEnd = parseFloat(row.distance_end);
  //     const totalOil = parseFloat(row.total_oil) || 0;

  //     // For simplicity, let's assume 'start' and 'stop' define board range
  //     // e.g. "5L" means board 5 from the left, "2R" means board 2 from the right, etc.
  //     // We'll parse them in a simplistic way.
  //     // Real logic might be more advanced.
  //     const [boardMin, boardMax] = this.getBoardRange(row.start, row.stop);

  //     // Distribute totalOil across that board range and distance range
  //     // For a simple approach, we can just add totalOil equally to each board in [boardMin..boardMax]
  //     for (let b = boardMin; b <= boardMax; b++) {
  //       for (let d = Math.floor(distStart); d < distEnd; d++) {
  //         accumulate(b, d, totalOil);
  //       }
  //     }
  //   });

  //   // 2) Process backwards_data
  //   pattern.backwards_data.forEach(row => {
  //     const distStart = parseFloat(row.distance_start);
  //     const distEnd = parseFloat(row.distance_end);
  //     const totalOil = parseFloat(row.total_oil) || 0;

  //     const [boardMin, boardMax] = this.getBoardRange(row.start, row.stop);

  //     // The machine is applying oil in reverse, but the distribution approach is similar
  //     // We'll iterate from distEnd..distStart if needed
  //     const lower = Math.min(distStart, distEnd);
  //     const upper = Math.max(distStart, distEnd);

  //     for (let b = boardMin; b <= boardMax; b++) {
  //       for (let d = Math.floor(lower); d < upper; d++) {
  //         accumulate(b, d, totalOil);
  //       }
  //     }
  //   });

  //   // Convert matrix object to array
  //   const result = [];
  //   for (const key in matrix) {
  //     const [bStr, dStr] = key.split(',');
  //     result.push({
  //       x: parseInt(bStr, 10),
  //       y: parseInt(dStr, 10),
  //       v: matrix[key]
  //     });
  //   }
  //   return result;
  // }

  // /**
  //  * Very simplified parser for "5L" or "3R" to board numbers.
  //  * E.g. "5L" => board 5 from the left, "2R" => board 39 - 2 => 37
  //  * (assuming 39 boards total).
  //  */
  // getBoardRange(start: string, stop: string): [number, number] {
  //   // Board count example: 39
  //   const maxBoard = 39;
  //   const parseBoard = (str: string) => {
  //     // e.g. "5L", "10L", "2R"
  //     const match = str.match(/(\d+)(L|R)/);
  //     if (!match) return 1;
  //     const num = parseInt(match[1], 10);
  //     const side = match[2];
  //     if (side === 'L') {
  //       return num; // board from left
  //     } else {
  //       return maxBoard - (num - 1); // from right
  //     }
  //   };

  //   const b1 = parseBoard(start);
  //   const b2 = parseBoard(stop);
  //   return [Math.min(b1, b2), Math.max(b1, b2)];
  // }
}
