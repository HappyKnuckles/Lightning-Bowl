import { Component, ElementRef, input, OnInit, ViewChild } from '@angular/core';
import { Pattern } from 'src/app/core/models/pattern.model';
import * as d3 from 'd3';
import { IonCard, IonCol, IonRow, IonGrid, IonCardContent, IonCardTitle, IonCardHeader, IonTitle, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pattern-info',
  standalone: true,
  imports: [IonLabel, IonTitle, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonCard],
  templateUrl: './pattern-info.component.html',
  styleUrl: './pattern-info.component.scss',
})
export class PatternInfoComponent implements OnInit {
  @ViewChild('svg', { static: true }) svgElement!: ElementRef;
  pattern = input.required<Pattern>();
  yMax = 72; // Maximum y-axis value (distance in feet)
  xMax = 39; // Maximum x-axis value (board number)

  ngOnInit(): void {
    this.drawChart(this.pattern()); // Call the drawChart method with the pattern data.
  }

  drawChart(pattern: Pattern): void {
    // Select the SVG element and set up a viewBox for responsiveness.
    const svg = d3
      .select(this.svgElement.nativeElement)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 400 800')
      .style('background-color', 'white')
      .style('margin-top', '16px')
      .style('margin-left', '8px')
      .style('margin-right', '8px');

    // Clear any previous content.
    svg.selectAll('*').remove();

    // Define margins.
    const margin = { top: 30, right: 10, bottom: 10, left: 30 };

    // Use the viewBox dimensions as the basis for our chart dimensions.
    const svgWidth = 375;
    const svgHeight = 800;

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
      .data(d3.range(0, this.xMax + 1, 1))
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

    // Draw a stronger line at y=60 to visually cap the grid.
    g.append('line').attr('x1', 0).attr('x2', width).attr('y1', yScale(60)).attr('y2', yScale(60)).attr('stroke', 'black').attr('stroke-width', 1);

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
    const computeRect = (data: any) => {
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

    // ----- Draw Rectangles for Forwards and Backwards Data -----
    // Now, each entry is checked for its total_oil value.
    if (pattern.forwards_data) {
      pattern.forwards_data.forEach((d: any) => {
        if (d.total_oil !== '0') {
          const rect = computeRect(d);
          g.append('rect')
            .attr('x', rect.x)
            .attr('y', rect.y)
            .attr('width', rect.width)
            .attr('height', rect.height)
            .attr('fill', 'red')
            .attr('fill-opacity', 0.3);
        }
      });
    }

    if (pattern.backwards_data) {
      pattern.backwards_data.forEach((d: any) => {
        if (d.total_oil !== '0') {
          const rect = computeRect(d);
          g.append('rect')
            .attr('x', rect.x)
            .attr('y', rect.y)
            .attr('width', rect.width)
            .attr('height', rect.height)
            .attr('fill', 'red')
            .attr('fill-opacity', 0.3);
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
    // ----- Add Bowling Pins in the Specified Formation -----
    // The formation should appear as:
    //    7  8  9 10
    //      4  5  6
    //        2  3
    //          1
    // where pin 1 is centered at y = 60.
    const centerX = this.xMax / 2;
    const baseY = 60; // Row 1 (pin 1)
    const rowSpacing = 4; // Vertical spacing between rows (data units)
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
      { board: 5, distance: 13 },
      { board: 10, distance: 14.5 },
      { board: 15, distance: 16 },
      { board: 20, distance: 17.5 },
      { board: 25, distance: 16 },
      { board: 30, distance: 14.5 },
      { board: 35, distance: 13 },
    ];

    // Create arrow shape as an upward-pointing triangle
    const arrowSize = 7; // Size of the arrow
    const arrowShape = d3
      .symbol()
      .type(d3.symbolTriangle)
      .size(arrowSize * arrowSize);

    // Add arrows at their respective positions
    g.selectAll('.lane-arrow')
      .data(arrowPositions)
      .enter()
      .append('path')
      .attr('class', 'lane-arrow')
      .attr('d', arrowShape)
      .attr('transform', (d) => `translate(${xScale(d.board)}, ${yScale(d.distance)})`) // No rotation needed for upward arrows
      .attr('fill', 'black')
      .attr('stroke', 'none');
  }
}
