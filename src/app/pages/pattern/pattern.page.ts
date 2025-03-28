import { Component, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { Pattern } from 'src/app/core/models/pattern.model';
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
  patterns: Pattern[] = [];

  ngOnInit() {
    this.patterns.push(
      {
        url: 'https://patternlibrary.kegel.net/pattern/0404b357-cf52-ec11-8c62-000d3a5afd36',
        title: 'Kegel Kode 4137 (40 uL TR)',
        category: 'Kode Series',
        details: {
          distance: "37'",
          ratio: '9.55:1',
          volume: '23.24',
          forward: '15.8',
          reverse: '7.44',
          pump: '40µL',
          tanks: 'KEGEL',
        },
        forwards_data: [
          {
            '#': '1',
            start: '2L',
            stop: '2R',
            load: '3',
            mics: '40',
            speed: '10',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '4.440',
            distance_start: '0.00',
            distance_end: '2.80',
          },
          {
            '#': '2',
            start: '4L',
            stop: '4R',
            load: '1',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.320',
            distance_start: '2.80',
            distance_end: '4.76',
          },
          {
            '#': '3',
            start: '5L',
            stop: '5R',
            load: '1',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.240',
            distance_start: '4.76',
            distance_end: '6.72',
          },
          {
            '#': '4',
            start: '7L',
            stop: '7R',
            load: '2',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '2.160',
            distance_start: '6.72',
            distance_end: '10.64',
          },
          {
            '#': '5',
            start: '9L',
            stop: '8R',
            load: '2',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.920',
            distance_start: '10.64',
            distance_end: '14.56',
          },
          {
            '#': '6',
            start: '10L',
            stop: '9R',
            load: '2',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.760',
            distance_start: '14.56',
            distance_end: '18.48',
          },
          {
            '#': '7',
            start: '11L',
            stop: '10R',
            load: '2',
            mics: '40',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.600',
            distance_start: '18.48',
            distance_end: '23.52',
          },
          {
            '#': '8',
            start: '12L',
            stop: '11R',
            load: '1',
            mics: '40',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '720',
            distance_start: '23.52',
            distance_end: '26.04',
          },
          {
            '#': '9',
            start: '13L',
            stop: '12R',
            load: '1',
            mics: '40',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '640',
            distance_start: '26.04',
            distance_end: '28.56',
          },
          {
            '#': '10',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '40',
            speed: '22',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '28.56',
            distance_end: '37.00',
          },
        ],
        backwards_data: [
          {
            '#': '1',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '40',
            speed: '26',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '37.00',
            distance_end: '18.00',
          },
          {
            '#': '2',
            start: '10L',
            stop: '9R',
            load: '1',
            mics: '40',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '880',
            distance_start: '18.00',
            distance_end: '15.48',
          },
          {
            '#': '3',
            start: '8L',
            stop: '8R',
            load: '2',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '2.000',
            distance_start: '15.48',
            distance_end: '11.56',
          },
          {
            '#': '4',
            start: '7L',
            stop: '7R',
            load: '2',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '2.160',
            distance_start: '11.56',
            distance_end: '7.64',
          },
          {
            '#': '5',
            start: '6L',
            stop: '6R',
            load: '1',
            mics: '40',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.160',
            distance_start: '7.64',
            distance_end: '5.68',
          },
          {
            '#': '6',
            start: '5L',
            stop: '5R',
            load: '1',
            mics: '40',
            speed: '10',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.240',
            distance_start: '5.68',
            distance_end: '4.28',
          },
          {
            '#': '7',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '40',
            speed: '10',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '4.28',
            distance_end: '0.00',
          },
        ],
      },
      {
        url: 'https://patternlibrary.kegel.net/pattern/b945a1e1-94b6-ec11-983f-0022480404ba',
        title: '2021 SYC Super Slam Championship',
        category: 'Storm Youth Championship',
        details: {
          distance: "40'",
          ratio: '3.57:1',
          volume: '26',
          forward: '18.8',
          reverse: '7.2',
          pump: '50µL',
          tanks: 'KEGEL & KEGEL',
        },
        forwards_data: [
          {
            '#': '1',
            start: '2L',
            stop: '2R',
            load: '3',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '5.550',
            distance_start: '0.00',
            distance_end: '5.04',
          },
          {
            '#': '2',
            start: '4L',
            stop: '4R',
            load: '1',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'B - KEGEL',
            total_oil: '1.650',
            distance_start: '5.04',
            distance_end: '7.56',
          },
          {
            '#': '3',
            start: '6L',
            stop: '6R',
            load: '1',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.450',
            distance_start: '7.56',
            distance_end: '10.08',
          },
          {
            '#': '4',
            start: '7L',
            stop: '7R',
            load: '2',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'B - KEGEL',
            total_oil: '2.700',
            distance_start: '10.08',
            distance_end: '15.12',
          },
          {
            '#': '5',
            start: '8L',
            stop: '8R',
            load: '2',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '2.500',
            distance_start: '15.12',
            distance_end: '20.16',
          },
          {
            '#': '6',
            start: '10L',
            stop: '10R',
            load: '2',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'B - KEGEL',
            total_oil: '2.100',
            distance_start: '20.16',
            distance_end: '25.20',
          },
          {
            '#': '7',
            start: '11L',
            stop: '11R',
            load: '3',
            mics: '50',
            speed: '22',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '2.850',
            distance_start: '25.20',
            distance_end: '34.44',
          },
          {
            '#': '8',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '50',
            speed: '26',
            buf: '3',
            tank: 'B - KEGEL',
            total_oil: '0',
            distance_start: '34.44',
            distance_end: '40.00',
          },
        ],
        backwards_data: [
          {
            '#': '1',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '50',
            speed: '30',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '34.00',
            distance_end: '26.00',
          },
          {
            '#': '2',
            start: '12L',
            stop: '10R',
            load: '1',
            mics: '50',
            speed: '22',
            buf: '3',
            tank: 'B - KEGEL',
            total_oil: '950',
            distance_start: '26.00',
            distance_end: '22.92',
          },
          {
            '#': '3',
            start: '11L',
            stop: '9R',
            load: '2',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '2.100',
            distance_start: '22.92',
            distance_end: '17.88',
          },
          {
            '#': '4',
            start: '10L',
            stop: '8R',
            load: '2',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'B - KEGEL',
            total_oil: '2.300',
            distance_start: '17.88',
            distance_end: '12.84',
          },
          {
            '#': '5',
            start: '2L',
            stop: '2R',
            load: '1',
            mics: '50',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.850',
            distance_start: '12.84',
            distance_end: '10.88',
          },
          {
            '#': '6',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '50',
            speed: '14',
            buf: '3',
            tank: 'B - KEGEL',
            total_oil: '0',
            distance_start: '10.88',
            distance_end: '0.00',
          },
        ],
      },
      {
        url: 'https://patternlibrary.kegel.net/pattern/c34590f0-93b6-ec11-983f-0022480404ba',
        title: '2016 IB Open',
        category: 'Various Patterns',
        details: {
          distance: "46'",
          ratio: '2.02:1',
          volume: '30.25',
          forward: '19.25',
          reverse: '11',
          pump: '50µL',
          tanks: 'KEGEL',
        },
        forwards_data: [
          {
            '#': '1',
            start: '2L',
            stop: '2R',
            load: '5',
            mics: '50',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '9.250',
            distance_start: '0.00',
            distance_end: '7.84',
          },
          {
            '#': '2',
            start: '5L',
            stop: '5R',
            load: '2',
            mics: '50',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '3.100',
            distance_start: '7.84',
            distance_end: '11.76',
          },
          {
            '#': '3',
            start: '8L',
            stop: '8R',
            load: '3',
            mics: '50',
            speed: '18',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '3.750',
            distance_start: '11.76',
            distance_end: '19.32',
          },
          {
            '#': '4',
            start: '14L',
            stop: '14R',
            load: '2',
            mics: '50',
            speed: '22',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.300',
            distance_start: '19.32',
            distance_end: '25.48',
          },
          {
            '#': '5',
            start: '2L',
            stop: '2R',
            load: '1',
            mics: '50',
            speed: '22',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.850',
            distance_start: '25.48',
            distance_end: '28.56',
          },
          {
            '#': '6',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '50',
            speed: '26',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '28.56',
            distance_end: '39.00',
          },
          {
            '#': '7',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '50',
            speed: '26',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '39.00',
            distance_end: '46.00',
          },
        ],
        backwards_data: [
          {
            '#': '1',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '50',
            speed: '26',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '36.00',
            distance_end: '32.00',
          },
          {
            '#': '2',
            start: '12L',
            stop: '12R',
            load: '2',
            mics: '50',
            speed: '22',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.700',
            distance_start: '32.00',
            distance_end: '25.84',
          },
          {
            '#': '3',
            start: '6L',
            stop: '6R',
            load: '3',
            mics: '50',
            speed: '22',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '4.350',
            distance_start: '25.84',
            distance_end: '16.60',
          },
          {
            '#': '4',
            start: '8L',
            stop: '8R',
            load: '1',
            mics: '50',
            speed: '22',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '1.250',
            distance_start: '16.60',
            distance_end: '13.52',
          },
          {
            '#': '5',
            start: '2L',
            stop: '2R',
            load: '2',
            mics: '50',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '3.700',
            distance_start: '13.52',
            distance_end: '9.60',
          },
          {
            '#': '6',
            start: '2L',
            stop: '2R',
            load: '0',
            mics: '50',
            speed: '14',
            buf: '3',
            tank: 'A - KEGEL',
            total_oil: '0',
            distance_start: '9.60',
            distance_end: '0.00',
          },
        ],
      },
    );
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
