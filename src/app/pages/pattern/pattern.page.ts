import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import * as d3 from 'd3';

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
  testPattern = {
    url: 'https://patternlibrary.kegel.net/pattern/0404b357-cf52-ec11-8c62-000d3a5afd36',
    title: 'Kegel Kode 4137 (40 uL TR)',
    category: 'Kode Series',
    details: {
      distance: "37'",
      ratio: '3.55:1',
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
  };
  yMax = 70; // Maximum y-axis value (distance in feet)
  xMax = 39; // Maximum x-axis value (board number)
  @ViewChild('svg', { static: true }) svgElement!: ElementRef;

  constructor(
    private patternService: PatternService,
    private hapticService: HapticService,
    public loadingService: LoadingService,
    private toastService: ToastService,
  ) {}
  async ngOnInit() {
    await this.loadPatterns();
    this.drawChart(this.testPattern);
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
      const patterns = response.patterns;
      if (response.total > 0) {
        this.patterns = [...this.patterns, ...patterns];
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
      this.loadingService.setLoading(true);
      if (event.detail.value === '') {
        this.hasMoreData = true;
        await this.loadPatterns();
      } else {
        const response = await this.patternService.searchPattern(event.detail.value);
        this.patterns = response.results;
        this.hasMoreData = false;
        this.currentPage = 1;
      }
      this.content.scrollToTop(300);
    } catch (error) {
      console.error('Error searching patterns:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
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

  drawChart(pattern: Pattern): void {
    // Clear any previous content
    d3.select(this.svgElement.nativeElement).selectAll('*').remove();

    // Define margins
    const margin = { top: 50, right: 30, bottom: 60, left: 60 };

    // Select the SVG element
    const svg = d3.select(this.svgElement.nativeElement).style('background-color', 'white');

    // Get width and height from SVG element
    const svgWidth = +svg.attr('width');
    const svgHeight = +svg.attr('height');

    // Calculate the inner chart dimensions
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Create a group element for the chart with margins
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales with the adjusted dimensions
    const xScale = d3.scaleLinear().domain([0, this.xMax]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, this.yMax]).range([height, 0]);

    // Add vertical grid lines for x-axis, but only up to y=60
    g.selectAll('.grid-line-x')
      .data(d3.range(0, this.xMax + 1, 1))
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', yScale(0)) // Bottom of chart
      .attr('y2', yScale(60)) // Only up to y=60, not full height
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 0.5);

    // Add horizontal grid lines for y-axis, ending at 60 instead of yMax
    g.selectAll('.grid-line-y')
      .data(d3.range(0, 61, 10)) // Grid lines up to 60 in steps of 10
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 0.5);

    // Draw a stronger line at y=60 to visually cap the grid
    g.append('line').attr('x1', 0).attr('x2', width).attr('y1', yScale(60)).attr('y2', yScale(60)).attr('stroke', 'black').attr('stroke-width', 1);

    // Helper function to parse x coordinates from string values like "2L" or "2R"
    const parseX = (value: string): number => {
      const num = parseFloat(value);
      if (value.toUpperCase().endsWith('L')) {
        return num - 1;
      } else if (value.toUpperCase().endsWith('R')) {
        return this.xMax - num;
      }
      return num;
    };

    // Function to compute rectangle dimensions from a data entry.
    // It uses the "start" and "stop" values for the x position and "distance_start"/"distance_end" for the y.
    const computeRect = (data: any) => {
      // Parse x coordinates from the start and stop strings
      const xStart = parseX(data.start);
      const xEnd = parseX(data.stop);
      // Use the smaller value as the left coordinate and compute the width as the difference
      const rectX = Math.min(xStart, xEnd);
      const rectWidth = Math.abs(xEnd - xStart);

      const yStartVal = parseFloat(data.distance_start);
      const yEndVal = parseFloat(data.distance_end);

      // Scale both values
      const y1 = yScale(yStartVal);
      const y2 = yScale(yEndVal);

      // The top of the rectangle is the smaller of y1 and y2
      const rectY = Math.min(y1, y2);
      // The height is the absolute difference
      const rectHeight = Math.abs(y2 - y1);

      return {
        x: xScale(rectX),
        y: rectY,
        width: xScale(rectWidth),
        height: rectHeight,
      };
    };

    // Draw rectangles for forward data (blue)
    if (pattern.forwards_data) {
      pattern.forwards_data.forEach((d: any) => {
        const rect = computeRect(d);
        g.append('rect')
          .attr('x', rect.x)
          .attr('y', rect.y)
          .attr('width', rect.width)
          .attr('height', rect.height)
          .attr('fill', 'blue')
          .attr('stroke', 'black');
      });
    }

    // Draw rectangles for backwards data (red)
    if (pattern.backwards_data) {
      pattern.backwards_data.forEach((d: any) => {
        const rect = computeRect(d);
        g.append('rect')
          .attr('x', rect.x)
          .attr('y', rect.y)
          .attr('width', rect.width)
          .attr('height', rect.height)
          .attr('fill', 'red')
          .attr('fill-opacity', 0.3)
          .attr('stroke', 'black');
      });
    }
    // Create and append the x-axis
    const xAxis = d3.axisBottom(xScale).tickValues(d3.range(0, this.xMax + 1, 1));
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text, line, path') // Select all text, tick marks, and axis lines
      .attr('fill', 'black') // Set text color to black
      .attr('stroke', 'black'); // Set line color to black

    // X-axis label - now positioned relative to the inner chart
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40) // Still below the axis
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .text('X Axis (0 to 39)');

    // Create and append the y-axis
    const yAxisScale = d3
      .scaleLinear()
      .domain([0, 60]) // Only up to 60
      .range([height, yScale(60)]); // Map to the correct pixel range

    // Create and append the y-axis with the custom scale
    const yAxis = d3.axisLeft(yAxisScale).tickValues(d3.range(0, 61, 5));
    g.append('g').call(yAxis).selectAll('text, line, path').attr('fill', 'black').attr('stroke', 'black');

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .text('Y Axis (0 to 60)');
  }
}
