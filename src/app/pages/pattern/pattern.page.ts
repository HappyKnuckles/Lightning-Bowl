import { Component, ElementRef, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
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
  IonModal,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ForwardsData, Pattern, ReverseData } from 'src/app/core/models/pattern.model';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/angular';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { PatternInfoComponent } from 'src/app/shared/components/pattern-info/pattern-info.component';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';
import * as d3 from 'd3';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.page.html',
  styleUrls: ['./pattern.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonIcon,
    IonButton,
    IonButtons,
    IonModal,
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
    PatternInfoComponent,
  ],
})
export class PatternPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  patterns: Pattern[] = [];
  currentPage = 1;
  hasMoreData = true;
  @ViewChildren('patternSvg') patternSvgElements!: QueryList<ElementRef>;

  constructor(
    private patternService: PatternService,
    private hapticService: HapticService,
    public loadingService: LoadingService,
    private toastService: ToastService,
    private chartService: ChartGenerationService,
    private sanitizer: DomSanitizer,
  ) {
    addIcons({ chevronBack });
  }
  async ngOnInit() {
    await this.loadPatterns();
    this.generateChartImages(); // Generate chart images for all patterns
    // this.renderCharts();
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

  // Use this when your patterns change too
  // renderCharts() {
  //   // Wait for change detection to complete
  //   setTimeout(() => {
  //     this.patternSvgElements.forEach((svgElement: ElementRef<any>, index: number) => {
  //       if (index < this.patterns.length) {
  //         const pattern = this.patterns[index];
  //         this.chartService.generatePatternChart(pattern, svgElement);
  //       }
  //     });
  //   });
  // }

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
      console.error('Error fetching patterns:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      if (!event) {
        this.loadingService.setLoading(false);
      }
      if (event) {
        event.target.complete();
      }
      this.generateChartImages();
    }
  }

  async searchPatterns(event: CustomEvent): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      if (event.detail.value === '') {
        this.hasMoreData = true;
        const response = await this.patternService.getPatterns(this.currentPage);
        this.patterns = response.patterns;
        this.currentPage++;
      } else {
        const response = await this.patternService.searchPattern(event.detail.value);
        this.patterns = response.patterns;
        this.hasMoreData = false;
        this.currentPage = 1;
      }
      this.content.scrollToTop(300);
    } catch (error) {
      console.error('Error searching patterns:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
      this.generateChartImages();
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

  private generateChartImages(): void {
    this.patterns.forEach((pattern) => {
      if (!pattern.chartImageSrc) {
        try {
          const svgDataUri = this.generatePatternChartDataUri(pattern, true);
          pattern.chartImageSrc = this.sanitizer.bypassSecurityTrustUrl(svgDataUri);
        } catch (error) {
          console.error(`Error generating chart for pattern ${pattern.title}:`, error);
        }
      }
    });
  }

  generatePatternChartDataUri(pattern: Pattern, horizontal = false): string {
    console.log('Generating Data URI for pattern:', pattern.title);

    // 1. Create a detached SVG element in memory
    const svgWidth = 325; // Base width for viewBox/drawing
    const svgHeight = 1300; // Base height for viewBox/drawing
    const tempSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Set necessary attributes directly on the temporary SVG
    d3.select(tempSvgElement)
      .attr('xmlns', 'http://www.w3.org/2000/svg') // Important for serialization
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('viewBox', '0 0 1300 400')
      .style('background-color', 'white'); // Background included in image
    // Note: border-radius won't apply to the <img> tag itself via SVG style

    // 2. Use D3 to draw onto the detached element
    const margin = { top: 30, right: 10, bottom: 10, left: 30 };
    const width = svgWidth - margin.top - margin.bottom;
    const height = svgHeight - margin.right - margin.left;

    const g = d3.select(tempSvgElement).append('g');

    if (horizontal) {
      g.attr('transform', `translate(0, ${width + 30}) rotate(-90)`);
      console.warn('Horizontal mode might require adjustments to scales and positioning.');
    } else {
      g.attr('transform', `translate(${margin.left}, ${margin.top})`);
    }

    const xScale = d3.scaleLinear().domain([0, 39]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 70]).range([height, 0]);

    // --- ALL THE D3 DRAWING LOGIC GOES HERE ---
    // (Exactly the same drawing calls as before, targeting 'g')
    // e.g., Grid lines, rects, axis, pins, arrows...
    // Add vertical grid lines for x-axis, but only up to y=60.
    g.selectAll('.grid-line-x')
      .data(d3.range(0, 39 + 1, 1))
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', yScale(0)) // Bottom of chart.
      .attr('y2', yScale(60)) // Only up to y=60.
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 0.5);

    // Add horizontal grid lines for y-axis, ending at 60 instead of yMax.
    g.selectAll('.grid-line-y')
      .data(d3.range(0, 61, 10)) // Grid lines up to 60 in steps of 10.
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 0.5);

    // Helper function to parse x coordinates from string values like "2L" or "2R".
    const parseX = (value: string): number => {
      const num = parseFloat(value);
      if (typeof value !== 'string') return 39 / 2; // Handle non-string input
      if (value.toUpperCase().endsWith('L')) {
        return num;
      } else if (value.toUpperCase().endsWith('R')) {
        return 39 - num;
      }
      if (value.toUpperCase() === 'C') {
        return 39 / 2;
      }
      return isNaN(num) ? 39 / 2 : num; // Default to center if just number or invalid
    };

    // Function to compute rectangle dimensions from a data entry.
    const computeRect = (data: ForwardsData | ReverseData) => {
      const xStart = parseX(data.start);
      const xEnd = parseX(data.stop);
      const rectX = Math.min(xStart, xEnd);
      const rectWidth = Math.abs(xEnd - xStart);

      const yStartVal = parseFloat(data.distance_start);
      const yEndVal = parseFloat(data.distance_end);

      const y1 = yScale(yStartVal);
      const y2 = yScale(yEndVal);
      const rectY = Math.min(y1, y2);
      const rectHeight = Math.abs(y2 - y1);

      return {
        x: xScale(rectX),
        y: rectY,
        width: xScale(rectX + rectWidth) - xScale(rectX), // Calculate width in scaled coordinates
        height: rectHeight,
      };
    };
    const parseOilValue = (oilStr: string | number | undefined): number => {
      if (typeof oilStr === 'number') return oilStr;
      if (typeof oilStr !== 'string' || !oilStr) return 0;
      return parseFloat(oilStr); // Basic parsing
    };

    const drawRects = (data: ForwardsData[] | ReverseData[] | undefined, color: string, opacity: number) => {
      if (!data) return;
      data.forEach((d) => {
        const oilVal = parseOilValue(d.total_oil);
        if (oilVal !== 0) {
          const rect = computeRect(d);
          if (rect.width > 0 && rect.height > 0) {
            // Avoid drawing zero-dimension rects
            g.append('rect')
              .attr('x', rect.x)
              .attr('y', rect.y)
              .attr('width', rect.width)
              .attr('height', rect.height)
              .attr('fill', color)
              .attr('fill-opacity', opacity);
          }
        }
      });
    };

    drawRects(pattern.forwards_data, 'red', 0.5);
    drawRects(pattern.reverse_data, 'red', 0.3);

    // Calculate Max Distances & Draw Background Areas
    let forwardsMaxDistance = 0;
    let reverseMaxDistance = 0;
    const getMaxDistance = (data: ForwardsData[] | ReverseData[] | undefined): number => {
      /* ... same as before ... */
      let maxDist = 0;
      if (data) {
        data.forEach((d) => {
          const distStart = parseFloat(d.distance_start);
          const distEnd = parseFloat(d.distance_end);
          if (!isNaN(distStart)) maxDist = Math.max(maxDist, distStart);
          if (!isNaN(distEnd)) maxDist = Math.max(maxDist, distEnd);
        });
      }
      return maxDist;
    };
    forwardsMaxDistance = getMaxDistance(pattern.forwards_data);
    reverseMaxDistance = getMaxDistance(pattern.reverse_data);

    const drawBackgroundArea = (maxDistance: number, opacity: number) => {
      /* ... same as before ... */
      if (maxDistance > 0) {
        g.append('rect')
          .attr('x', xScale(0))
          .attr('y', yScale(maxDistance))
          .attr('width', xScale(39))
          .attr('height', yScale(0) - yScale(maxDistance))
          .attr('fill', 'lightblue')
          .attr('fill-opacity', opacity)
          .lower();
      }
    };
    drawBackgroundArea(reverseMaxDistance, 0.1);
    drawBackgroundArea(forwardsMaxDistance, 0.15);

    // Y-Axis
    const yAxisScale = d3
      .scaleLinear()
      .domain([0, 60])
      .range([yScale(0), yScale(60)]);
    const yAxis = d3.axisLeft(yAxisScale).tickValues(d3.range(0, 61, 5));
    g.append('g').attr('class', 'y-axis').call(yAxis).selectAll('line, path').attr('stroke', 'gray').attr('stroke-width', 0.75);
    g.selectAll('.y-axis text').attr('fill', 'black').attr('stroke-width', 0.5);

    // Bowling Pins
    const pinCenterXBoard = 39 / 2;
    const pinBaseY = 60;
    const pinRowOffsetY = 2.5;
    const pinColOffsetX = 10;
    const pinsData = [
      /* ... same pin data objects as before ... */ { number: 7, xBoard: pinCenterXBoard - 1.5 * pinColOffsetX, yFeet: pinBaseY + 3 * pinRowOffsetY },
      { number: 8, xBoard: pinCenterXBoard - 0.5 * pinColOffsetX, yFeet: pinBaseY + 3 * pinRowOffsetY },
      { number: 9, xBoard: pinCenterXBoard + 0.5 * pinColOffsetX, yFeet: pinBaseY + 3 * pinRowOffsetY },
      { number: 10, xBoard: pinCenterXBoard + 1.5 * pinColOffsetX, yFeet: pinBaseY + 3 * pinRowOffsetY },
      { number: 4, xBoard: pinCenterXBoard - 1.0 * pinColOffsetX, yFeet: pinBaseY + 2 * pinRowOffsetY },
      { number: 5, xBoard: pinCenterXBoard, yFeet: pinBaseY + 2 * pinRowOffsetY },
      { number: 6, xBoard: pinCenterXBoard + 1.0 * pinColOffsetX, yFeet: pinBaseY + 2 * pinRowOffsetY },
      { number: 2, xBoard: pinCenterXBoard - 0.5 * pinColOffsetX, yFeet: pinBaseY + 1 * pinRowOffsetY },
      { number: 3, xBoard: pinCenterXBoard + 0.5 * pinColOffsetX, yFeet: pinBaseY + 1 * pinRowOffsetY },
      { number: 1, xBoard: pinCenterXBoard, yFeet: pinBaseY },
    ];
    const pinRadiusPixels = 13;
    const pinsGroup = g.append('g').attr('class', 'pins-group');
    pinsGroup
      .selectAll('.pin')
      .data(pinsData)
      .enter()
      .append('circle')
      .attr('class', 'pin')
      .attr('cx', (d) => xScale(d.xBoard))
      .attr('cy', (d) => yScale(d.yFeet))
      .attr('r', pinRadiusPixels)
      .attr('fill', 'white')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

    // Lane Arrows
    const arrowPositions = [
      /* ... same arrow data objects as before ... */ { board: 5, distance: 12.5 },
      { board: 10, distance: 13.5 },
      { board: 15, distance: 14.5 },
      { board: 20, distance: 15.5 },
      { board: 25, distance: 14.5 },
      { board: 30, distance: 13.5 },
      { board: 35, distance: 12.5 },
    ];
    const arrowSize = 6;
    const arrowShape = d3
      .symbol()
      .type(d3.symbolTriangle)
      .size(arrowSize * arrowSize);
    g.selectAll('.lane-arrow')
      .data(arrowPositions)
      .enter()
      .append('path')
      .attr('class', 'lane-arrow')
      .attr('d', arrowShape)
      .attr('transform', (d) => `translate(${xScale(d.board)}, ${yScale(d.distance)}) scale(1, 2.0)`)
      .attr('fill', 'black')
      .attr('stroke', 'none');
    // --- END OF D3 DRAWING LOGIC ---

    // 3. Serialize the SVG to string
    const svgString = tempSvgElement.outerHTML;

    // 4. Encode the SVG string using Base64
    const encodedString = btoa(unescape(encodeURIComponent(svgString))); // Handles UTF-8 chars better

    // 5. Return the Data URI
    return 'data:image/svg+xml;base64,' + encodedString;
  }
}
