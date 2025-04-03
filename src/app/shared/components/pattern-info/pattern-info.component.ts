import { Component, ElementRef, input, OnInit, ViewChild } from '@angular/core';
import { ReverseData, ForwardsData, Pattern } from 'src/app/core/models/pattern.model';
import * as d3 from 'd3';
import { IonCol, IonRow, IonGrid, IonLabel, IonChip } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pattern-info',
  standalone: true,
  imports: [IonChip, IonLabel, IonGrid, IonRow, IonCol],
  templateUrl: './pattern-info.component.html',
  styleUrl: './pattern-info.component.scss',
})
export class PatternInfoComponent implements OnInit {
  @ViewChild('svg', { static: true }) svgElement!: ElementRef;
  pattern = input.required<Pattern>();
  yMax = 70; // Maximum y-axis value (distance in feet)
  xMax = 39; // Maximum x-axis value (board number)

  ngOnInit(): void {
    this.drawChart(this.pattern());
  }

  getDifficulty() {
    const numericPart = this.pattern().details.ratio!.split(':')[0];
    const num = parseInt(numericPart, 10);
    if (num <= 4) {
      return 'Hard';
    } else if (num <= 8) {
      return 'Medium';
    } else {
      return 'Easy';
    }
  }

  getLength() {
    const length = parseInt(this.pattern().details.distance, 10);
    if (length <= 35) {
      return 'Short';
    } else if (length < 41) {
      return 'Medium';
    } else {
      return 'Long';
    }
  }

  getVolume() {
    const volume = parseInt(this.pattern().details.volume, 10);
    if (volume < 22) {
      return 'Light';
    } else if (volume <= 26) {
      return 'Medium';
    } else if (volume < 30) {
      return 'High';
    } else {
      return 'Very High';
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

  drawChart(pattern: Pattern): void {
    // Select the SVG element and set up a viewBox for responsiveness.
    const svg = d3
      .select(this.svgElement.nativeElement)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 400 1500')
      .style('background-color', 'white');
    // .style('margin-top', '16px')
    // .style('margin-left', '8px')
    // .style('margin-right', '8px');

    // Clear any previous content.
    svg.selectAll('*').remove();

    // Define margins.
    const margin = { top: 30, right: 10, bottom: 10, left: 30 };

    // Use the viewBox dimensions as the basis for our chart dimensions.
    const svgWidth = 375;
    const svgHeight = 1500;

    // Calculate the inner chart dimensions.
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Create a group element for the chart with margins.
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales with the adjusted dimensions.
    const xScale = d3.scaleLinear().domain([0, this.xMax]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, this.yMax]).range([height, 0]);

    // Add vertical grid lines for x-axis, but only up to y=60.
    g.selectAll('.grid-line-x')
      .data(d3.range(-1, this.xMax + 1, 1))
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
      const num = parseFloat(value) - 1;
      if (value.toUpperCase().endsWith('L')) {
        return num;
      } else if (value.toUpperCase().endsWith('R')) {
        return this.xMax - num;
      }
      return num;
    };

    // Function to compute rectangle dimensions from a data entry.
    const computeRect = (data: ForwardsData | ReverseData) => {
      // Parse x coordinates from the start and stop strings.
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
        width: xScale(rectWidth),
        height: rectHeight,
      };
    };

    // ----- Draw Rectangles for Forwards and Reverse Data -----
    // Now, each entry is checked for its total_oil value.
    // Compute all total_oil values from both forwards and reverse data
    let totalOil = 0;
    const parseOilValue = (oilStr: string): number => {
      if (oilStr.includes('.')) {
        const parts = oilStr.split('.');
        // Determine the factor based on the number of digits after the decimal.
        const factor = Math.pow(10, parts[1].length);
        return parseFloat(oilStr) * factor;
      }
      return parseFloat(oilStr);
    };
    const allOilValues: number[] = [];
    if (pattern.forwards_data) {
      pattern.forwards_data.forEach((d: ForwardsData) => {
        const oilVal = parseOilValue(d.total_oil);
        if (oilVal !== 0) {
          allOilValues.push(oilVal);
          totalOil += oilVal;
        }
      });
    }
    if (pattern.reverse_data) {
      pattern.reverse_data.forEach((d: ReverseData) => {
        const oilVal = parseOilValue(d.total_oil);
        if (oilVal !== 0) {
          allOilValues.push(oilVal);
          totalOil += oilVal;
        }
      });
    }

    // Determine min and max oil values with fallback values to prevent undefined
    // const oilMin = d3.min(allOilValues) ?? 0;
    // const oilMax = d3.max(allOilValues) ?? 1;

    // Create a color scale. Adjust the color range as needed.
    const colorScale = d3.scaleLinear<string>().domain([0, totalOil]).range(['#ff8888', '#990000']); // From light red to dark red

    // Draw rectangles for forwards_data with color based on total_oil
    if (pattern.forwards_data) {
      pattern.forwards_data.forEach((d: ForwardsData) => {
        if (d.total_oil !== '0') {
          const rect = computeRect(d);
          const oilVal = parseOilValue(d.total_oil);
          g.append('rect')
            .attr('x', rect.x)
            .attr('y', rect.y)
            .attr('width', rect.width)
            .attr('height', rect.height)
            // Use the color scale to set the fill
            .attr('fill', colorScale(oilVal))
            .attr('fill-opacity', 0.8);
        }
      });
    }

    // Draw rectangles for reverse_data with color based on total_oil
    if (pattern.reverse_data) {
      pattern.reverse_data.forEach((d: ReverseData) => {
        if (d.total_oil !== '0') {
          const rect = computeRect(d);
          const oilVal = parseOilValue(d.total_oil);
          g.append('rect')
            .attr('x', rect.x)
            .attr('y', rect.y)
            .attr('width', rect.width)
            .attr('height', rect.height)
            .attr('fill', colorScale(oilVal))
            .attr('fill-opacity', 0.8);
        }
      });
    }

    // Create and append the y-axis.
    const yAxisScale = d3
      .scaleLinear()
      .domain([0, 60])
      .range([height, yScale(60)]);
    const yAxis = d3.axisLeft(yAxisScale).tickValues(d3.range(0, 61, 5));
    // Added smaller stroke width

    g.append('g').call(yAxis).selectAll('line, path').attr('stroke', 'lightgray').attr('stroke-width', 0.5); // Added smaller stroke width

    g.append('g').call(yAxis).selectAll('text').attr('fill', 'black').attr('stroke-width', 0.5);

    let forwardsMaxDistance = 0;
    let reverseMaxDistance = 0;

    if (pattern.forwards_data && pattern.forwards_data.length > 0) {
      pattern.forwards_data.forEach((d) => {
        const distanceStart = parseFloat(d.distance_start);
        const distanceEnd = parseFloat(d.distance_end);
        forwardsMaxDistance = Math.max(forwardsMaxDistance, distanceStart, distanceEnd);
      });
    }

    if (pattern.reverse_data && pattern.reverse_data.length > 0) {
      pattern.reverse_data.forEach((d) => {
        const distanceStart = parseFloat(d.distance_start);
        const distanceEnd = parseFloat(d.distance_end);
        reverseMaxDistance = Math.max(reverseMaxDistance, distanceStart, distanceEnd);
      });
    }

    // Draw forwards area background (lighter)
    // Draw reverse area background (slightly darker)
    if (reverseMaxDistance != forwardsMaxDistance) {
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(forwardsMaxDistance))
        .attr('width', width)
        .attr('height', yScale(0) - yScale(forwardsMaxDistance))
        .attr('fill', 'red')
        .attr('fill-opacity', 0.05);
    }

    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(reverseMaxDistance))
      .attr('width', width)
      .attr('height', yScale(0) - yScale(reverseMaxDistance))
      .attr('fill', 'red')
      .attr('fill-opacity', 0.1); // Higher opacity

    // ----- Add Bowling Pins in the Specified Formation -----
    // The formation should appear as:
    //    7  8  9 10
    //      4  5  6
    //        2  3
    //          1
    // where pin 1 is centered at y = 60.
    const centerX = this.xMax / 2;
    const baseY = 60; // Row 1 (pin 1)
    const rowSpacing = 3; // Vertical spacing between rows (data units)
    const offset = 12; // Base horizontal offset for positioning pins

    // Row definitions (data coordinates):
    // Row 1: one pin (number 1)
    const row1 = [{ number: 1, x: centerX, y: baseY }];
    // Row 2: two pins (numbers 2 and 3)
    const row2 = [
      { number: 2, x: centerX - offset / 2, y: baseY + rowSpacing },
      { number: 3, x: centerX + offset / 2, y: baseY + rowSpacing },
    ];
    // Row 3: three pins (numbers 4, 5, 6)
    const row3 = [
      { number: 4, x: centerX - offset, y: baseY + 2 * rowSpacing },
      { number: 5, x: centerX, y: baseY + 2 * rowSpacing },
      { number: 6, x: centerX + offset, y: baseY + 2 * rowSpacing },
    ];
    // Row 4: four pins (numbers 7, 8, 9, 10)
    const row4 = [
      { number: 7, x: centerX - 1.5 * offset, y: baseY + 3 * rowSpacing },
      { number: 8, x: centerX - 0.5 * offset, y: baseY + 3 * rowSpacing },
      { number: 9, x: centerX + 0.5 * offset, y: baseY + 3 * rowSpacing },
      { number: 10, x: centerX + 1.5 * offset, y: baseY + 3 * rowSpacing },
    ];

    // Concatenate rows so that row4 appears at the top.
    const pins = [...row4, ...row3, ...row2, ...row1];

    // Define the pin radius in pixels.
    const pinRadius = 20;

    // Add a group for pins so they are drawn on top.
    const pinsGroup = g.append('g').attr('class', 'pins-group');

    // Draw each bowling pin as a circle.
    pinsGroup
      .selectAll('.pin')
      .data(pins)
      .enter()
      .append('circle')
      .attr('class', 'pin')
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('r', pinRadius)
      .attr('fill', 'white')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

    const arrowPositions = [
      { board: 4, distance: 12.5 }, // Was 13.5
      { board: 9, distance: 13.5 }, // Was 14.5
      { board: 14, distance: 14.5 }, // Was 15.5
      { board: 19, distance: 15.5 }, // Was 16.5 (now at 15)
      { board: 24, distance: 14.5 }, // Was 15.5
      { board: 29, distance: 13.5 }, // Was 14.5
      { board: 34, distance: 12.5 }, // Was 13.5
    ];

    // Create arrow shape as an upward-pointing triangle
    const arrowSize = 7; // Size of the arrow
    const arrowShape = d3
      .symbol()
      .type(d3.symbolTriangle)
      .size(arrowSize * arrowSize);

    // Add arrows at their respective positions with vertical stretch
    g.selectAll('.lane-arrow')
      .data(arrowPositions)
      .enter()
      .append('path')
      .attr('class', 'lane-arrow')
      .attr('d', arrowShape)
      .attr('transform', (d) => {
        // Apply both translation and scaling in one transform
        // Scale factor 1 for x (no horizontal stretch) and 1.7 for y (vertical stretch)
        return `translate(${xScale(d.board)}, ${yScale(d.distance)}) scale(1, 2.5)`;
      })
      .attr('fill', 'black')
      .attr('stroke', 'none');
  }
}
