import { ElementRef, Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Game } from 'src/app/core/models/game.model';
import { Stats } from 'src/app/core/models/stats.model';
import Chart, {
  ChartConfiguration,
  ScatterDataPoint,
  Plugin,
  ChartEvent,
  LegendItem,
  ChartOptions,
  LegendElement,
  ChartDataset,
} from 'chart.js/auto';
import { Ball } from '../../models/ball.model';
import zoomPlugin from 'chartjs-plugin-zoom';

const ballDistributionZonePlugin: Plugin<'scatter'> = {
  id: 'ballDistributionZones',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales['x'] || !scales['y']) return;
    ctx.save();

    const xRanges = [
      { min: scales['x'].min, max: 0.035, label: 'Low Diff' },
      { min: 0.035, max: 0.05, label: 'Med Diff' },
      { min: 0.05, max: scales['x'].max, label: 'High Diff' },
    ];
    const yRanges = [
      { min: scales['y'].min, max: 2.52, label: 'Low RG' },
      { min: 2.52, max: 2.58, label: 'Med RG' },
      { min: 2.58, max: scales['y'].max, label: 'High RG' },
    ];
    const zoneStyles = [
      { color: 'rgba(220,20,60,0.05)', borderColor: 'rgba(220,20,60,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(255,140,0,0.05)', borderColor: 'rgba(255,140,0,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(255,215,0,0.05)', borderColor: 'rgba(255,215,0,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(30,144,255,0.05)', borderColor: 'rgba(30,144,255,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(128,128,128,0.05)', borderColor: 'rgba(128,128,128,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(34,139,34,0.05)', borderColor: 'rgba(34,139,34,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(147,112,219,0.05)', borderColor: 'rgba(147,112,219,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(75,0,130,0.05)', borderColor: 'rgba(75,0,130,0.3)', textColor: '#F5F5F5' },
      { color: 'rgba(0,139,139,0.05)', borderColor: 'rgba(0,139,139,0.3)', textColor: '#F5F5F5' },
    ];

    let idx = 0;
    for (const yR of yRanges) {
      for (const xR of xRanges) {
        const style = zoneStyles[idx++];
        const x1 = scales['x'].getPixelForValue(xR.min);
        const x2 = scales['x'].getPixelForValue(xR.max);
        const y1 = scales['y'].getPixelForValue(yR.max);
        const y2 = scales['y'].getPixelForValue(yR.min);
        const left = Math.max(chartArea.left, Math.min(x1, x2));
        const right = Math.min(chartArea.right, Math.max(x1, x2));
        const top = Math.max(chartArea.top, Math.min(y1, y2));
        const bottom = Math.min(chartArea.bottom, Math.max(y1, y2));
        const width = right - left;
        const height = bottom - top;
        if (width > 0 && height > 0) {
          // Fill the zone
          ctx.fillStyle = style.color;
          ctx.fillRect(left, top, width, height);

          // Draw the border for the zone
          ctx.strokeStyle = style.borderColor;
          ctx.lineWidth = 1; // Adjust line width as needed
          ctx.strokeRect(left, top, width, height);

          // Draw the text labels
          ctx.fillStyle = style.textColor;
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const lines = [xR.label, yR.label];
          const lineH = 10;
          let yText = top + (height - lines.length * lineH) / 2 + lineH / 2;
          for (const line of lines) {
            ctx.fillText(line, left + width / 2, yText);
            yText += lineH;
          }
        }
      }
    }

    ctx.restore();
  },
};

const customAxisTitlesPlugin: Plugin<'scatter'> = {
  id: 'customAxisTitles',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    // --- X-Axis Title Logic ---
    ctx.save();
    ctx.fillStyle = 'grey';
    ctx.font = 'bold 12px Arial';
    const xAxisYPos = chartArea.bottom + 35;

    ctx.textAlign = 'left';
    ctx.fillText('← Less Flare', chartArea.left - 20, xAxisYPos);

    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Diff', (chartArea.left + chartArea.right) / 2, xAxisYPos);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'grey';
    ctx.fillText('More Flare →', chartArea.right + 10, xAxisYPos);
    ctx.restore();

    // --- Y-Axis Title Logic ---
    ctx.save();
    const yAxisXPos = chartArea.left - 40;
    const earlierRollYPos = chartArea.bottom - 25;
    const diffYPos = (chartArea.top + chartArea.bottom) / 2;
    const laterRollPos = chartArea.top + 35;

    function drawRotated(text: string, x: number, y: number, font: string, color: string) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    drawRotated('← Earlier Roll', yAxisXPos, earlierRollYPos, 'bold 12px Arial', 'grey');
    drawRotated('RG', yAxisXPos, diffYPos, 'bold 14px Arial', 'white');
    drawRotated('Later Roll →', yAxisXPos, laterRollPos, 'bold 12px Arial', 'grey');

    ctx.restore();
  },
};
@Injectable({
  providedIn: 'root',
})
export class ChartGenerationService {
  generateScoreChart(
    scoreChart: ElementRef,
    games: Game[],
    existingChartInstance: Chart | undefined,
    viewMode?: 'week' | 'game' | 'monthly' | 'yearly',
    onToggleView?: () => void,
    isReload?: boolean,
  ): Chart {
    try {
      const currentViewMode = viewMode || 'game';
      const { gameLabels, overallAverages, differences, gamesPlayedDaily } = this.calculateScoreChartData(games, currentViewMode);
      const ctx = scoreChart.nativeElement;
      let chartInstance: Chart;
      if (isReload && existingChartInstance) {
        existingChartInstance.destroy();
      }

      const plugins: Plugin<'line' | 'bar'>[] = [];
      const options: ChartOptions<'line' | 'bar'> = {
        scales: {
          y: { beginAtZero: true, suggestedMax: 300, ticks: { font: { size: 14 } } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 14 } } },
        },
        plugins: {
          title: { display: true, text: 'Score Analysis', color: 'white', font: { size: 20 } },
          legend: {
            display: true,
            labels: { font: { size: 15 } },
            onClick: (e: ChartEvent, legendItem: LegendItem, legend: LegendElement<'line' | 'bar'>) => {
              const index = legendItem.datasetIndex!;
              const ci = legend.chart;
              const meta = ci.getDatasetMeta(index);
              meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : !meta.hidden;
              const gamesPlayedIndex = ci.data.datasets.findIndex((dataset: ChartDataset) => dataset.label === 'Games played');
              if (gamesPlayedIndex !== -1) {
                const gamesPlayedMeta = ci.getDatasetMeta(gamesPlayedIndex);
                if (ci.options.scales && ci.options.scales['y1']) {
                  ci.options.scales['y1'].display = !gamesPlayedMeta.hidden;
                }
              }
              ci.update();
            },
          },
        },
      };

      if (onToggleView && viewMode) {
        const toggleButtonPlugin = {
          id: 'toggleButton',
          afterDraw: (chart: Chart) => {
            const { ctx } = chart;
            const titleBlock = (chart as { titleBlock?: { top: number; height: number } }).titleBlock;

            if (!titleBlock || !titleBlock.height) {
              return;
            }

            const baseRatio = 35;
            const minFontSize = 10;
            const maxFontSize = 14;
            const padding = 10;

            const fontSize = Math.max(minFontSize, Math.min(maxFontSize, chart.width / baseRatio));
            ctx.font = `bold ${fontSize}px Arial`;

            const buttonTextMap: Record<string, string> = {
              game: 'Weekly',
              week: 'Monthly',
              monthly: 'By Game',
            };
            const buttonText = buttonTextMap[viewMode] || 'By Game';
            const textMetrics = ctx.measureText(buttonText);

            const button = {
              width: textMetrics.width + padding * 2,
              height: fontSize + padding,
              x: chart.width - (textMetrics.width + padding * 2) - 10,
              y: titleBlock.top + (titleBlock.height - (fontSize + padding)) / 2,
            };

            (chart as { toggleButtonBounds?: typeof button }).toggleButtonBounds = button;

            ctx.save();
            ctx.fillStyle = 'rgba(153, 102, 255, 0.8)';
            ctx.strokeStyle = 'rgba(153, 102, 255, 1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(button.x, button.y, button.width, button.height, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(buttonText, button.x + button.width / 2, button.y + button.height / 2);
            ctx.restore();
          },
        };
        plugins.push(toggleButtonPlugin);
      }
      if (existingChartInstance && !isReload) {
        existingChartInstance.data.labels = gameLabels;
        existingChartInstance.data.datasets[0].data = overallAverages;
        existingChartInstance.data.datasets[1].data = differences;
        existingChartInstance.data.datasets[2].data = gamesPlayedDaily;
        existingChartInstance.update();
        return existingChartInstance;
      } else {
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: gameLabels,
            datasets: [
              {
                label: 'Average over time',
                data: overallAverages,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                pointHitRadius: 10,
              },
              {
                label: 'Difference from average',
                data: differences,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                pointHitRadius: 10,
              },
              {
                label: 'Games played',
                data: gamesPlayedDaily,
                type: 'bar',
                backgroundColor: 'rgba(153, 102, 255, 0.1)',
                borderColor: 'rgba(153, 102, 255, .5)',
                borderWidth: 1,
                yAxisID: 'y1',
              },
            ],
          },
          options: options,
          plugins: plugins,
        });

        if (onToggleView) {
          chartInstance.canvas.onclick = (event) => {
            const rect = chartInstance.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const buttonBounds = (chartInstance as { toggleButtonBounds?: { x: number; y: number; width: number; height: number } })
              .toggleButtonBounds;
            if (
              buttonBounds &&
              x >= buttonBounds.x &&
              x <= buttonBounds.x + buttonBounds.width &&
              y >= buttonBounds.y &&
              y <= buttonBounds.y + buttonBounds.height
            ) {
              onToggleView();
            }
          };
        }
      }

      return chartInstance;
    } catch (error) {
      console.error('Error generating score chart:', error);
      throw error;
    }
  }

  generateScoreDistributionChart(
    scoreDistributionChart: ElementRef,
    games: Game[],
    existingChartInstance: Chart | undefined,
    isReload?: boolean,
  ): Chart {
    try {
      const ctx = scoreDistributionChart.nativeElement;

      const scoreLabels = Array.from({ length: 30 }, (_, i) => {
        const start = i * 10;
        const end = i < 29 ? i * 10 + 9 : 300;
        return `${start}-${end}`;
      });
      const scoreDistribution = new Array<number>(30).fill(0);

      games.forEach((game) => {
        const score = Math.min(Math.max(game.totalScore, 0), 299);
        const index = Math.floor(score / 10);
        scoreDistribution[index]++;
      });

      const compressedLabels: string[] = [];
      const compressedData: number[] = [];
      let zeroStart: number | null = null;

      for (let i = 0; i < scoreLabels.length; i++) {
        if (scoreDistribution[i] === 0) {
          if (zeroStart === null) zeroStart = i;
        } else {
          if (zeroStart !== null) {
            compressedLabels.push(`${zeroStart * 10}-${(i - 1) * 10 + 9}`);
            compressedData.push(0);
            zeroStart = null;
          }
          compressedLabels.push(scoreLabels[i]);
          compressedData.push(scoreDistribution[i]);
        }
      }
      if (zeroStart !== null) {
        compressedLabels.push(`${zeroStart * 10}-${(scoreLabels.length - 1) * 10 + 9}`);
        compressedData.push(0);
      }

      const finalLabels = compressedLabels;
      const finalData = compressedData;
      const maxFrequency = Math.max(...finalData);

      if (isReload && existingChartInstance) {
        existingChartInstance.destroy();
      }

      if (existingChartInstance && !isReload) {
        existingChartInstance.data.labels = finalLabels;
        existingChartInstance.data.datasets[0].data = finalData;
        existingChartInstance.update();
        return existingChartInstance;
      } else {
        return new Chart(ctx, {
          type: 'bar',
          data: {
            labels: finalLabels,
            datasets: [
              {
                label: 'Score Distribution',
                data: finalData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              x: { ticks: { font: { size: 14 } } },
              y: {
                beginAtZero: true,
                suggestedMax: maxFrequency + 1,
                title: {
                  display: true,
                  text: 'Frequency',
                  color: 'white',
                  font: { size: 16 },
                },
                ticks: { font: { size: 14 } },
              },
            },
            plugins: {
              title: {
                display: true,
                text: 'Score Distribution',
                color: 'white',
                font: { size: 20 },
              },
              legend: { display: false },
            },
          },
        });
      }
    } catch (error) {
      console.error('Error generating score distribution chart:', error);
      throw error;
    }
  }

  generateAverageScoreChart(
    scoreChart: ElementRef,
    games: Game[],
    existingChartInstance: Chart | undefined,
    viewMode?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    onToggleView?: () => void,
    isReload?: boolean,
  ): Chart {
    try {
      const currentViewMode = viewMode || 'monthly';
      const { gameLabels, averages, gamesPlayedDaily } = this.calculateAverageScoreChartData(games, currentViewMode);
      const ctx = scoreChart.nativeElement;
      let chartInstance: Chart;
      if (isReload && existingChartInstance) {
        existingChartInstance.destroy();
      }

      const plugins: Plugin<'line' | 'bar'>[] = [];
      const options: ChartOptions<'line' | 'bar'> = {
        scales: {
          y: { beginAtZero: true, suggestedMax: 300, ticks: { font: { size: 14 } } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 14 } } },
        },
        plugins: {
          title: { display: true, text: `Average Score`, color: 'white', font: { size: 20 } },
          legend: { display: true, labels: { font: { size: 15 } } },
        },
      };

      if (onToggleView) {
        const toggleButtonPlugin: Plugin<'line' | 'bar'> = {
          id: 'toggleButton',
          afterDraw: (chart: Chart) => {
            const { ctx } = chart;
            const titleBlock = (chart as { titleBlock?: { top: number; height: number } }).titleBlock;

            if (!titleBlock || !titleBlock.height) {
              return;
            }

            const baseRatio = 35;
            const minFontSize = 10;
            const maxFontSize = 14;
            const padding = 10;

            const fontSize = Math.max(minFontSize, Math.min(maxFontSize, chart.width / baseRatio));
            ctx.font = `bold ${fontSize}px Arial`;

            const buttonText = `${
              currentViewMode === 'daily' ? 'Weekly' : currentViewMode === 'weekly' ? 'Monthly' : currentViewMode === 'monthly' ? 'Yearly' : 'Daily'
            }`;
            const textMetrics = ctx.measureText(buttonText);

            const button = {
              width: textMetrics.width + padding * 2,
              height: fontSize + padding,
              x: chart.width - (textMetrics.width + padding * 2) - 10,
              y: titleBlock.top + (titleBlock.height - (fontSize + padding)) / 2,
            };

            (chart as { toggleButtonBounds?: typeof button }).toggleButtonBounds = button;

            ctx.save();
            ctx.fillStyle = 'rgba(153, 102, 255, 0.8)';
            ctx.strokeStyle = 'rgba(153, 102, 255, 1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(button.x, button.y, button.width, button.height, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(buttonText, button.x + button.width / 2, button.y + button.height / 2);
            ctx.restore();
          },
        };
        plugins.push(toggleButtonPlugin);
      }

      if (existingChartInstance && !isReload) {
        existingChartInstance.data.labels = gameLabels;
        existingChartInstance.data.datasets[0].data = averages;
        existingChartInstance.data.datasets[1].data = gamesPlayedDaily;
        existingChartInstance.update();
        return existingChartInstance;
      } else {
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: gameLabels,
            datasets: [
              {
                label: `Average Score`,
                data: averages,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderWidth: 2,
                fill: false,
              },
              {
                label: 'Games Played',
                data: gamesPlayedDaily,
                type: 'bar',
                backgroundColor: 'rgba(153, 102, 255, 0.1)',
                borderColor: 'rgba(153, 102, 255, .5)',
                borderWidth: 1,
                yAxisID: 'y1',
              },
            ],
          },
          options: options,
          plugins: plugins,
        });

        if (onToggleView) {
          chartInstance.canvas.onclick = (event) => {
            const rect = chartInstance.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const button = { x: chartInstance.width - 120, y: 10, width: 110, height: 30 };

            if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
              onToggleView();
            }
          };
        }
      }

      return chartInstance;
    } catch (error) {
      console.error('Error generating average score chart:', error);
      throw error;
    }
  }

  generatePinChart(pinChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
    try {
      const { filteredSpareRates, filteredMissedCounts } = this.calculatePinChartData(stats);
      const ctx = pinChart.nativeElement;

      if (isReload && existingChartInstance) {
        existingChartInstance.destroy();
      }

      if (existingChartInstance && !isReload) {
        existingChartInstance.data.datasets[0].data = filteredSpareRates;
        existingChartInstance.data.datasets[1].data = filteredMissedCounts;
        existingChartInstance.update();
        return existingChartInstance;
      } else {
        return new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['1 Pin', '2 Pins', '3 Pins', '4 Pins', '5 Pins', '6 Pins', '7 Pins', '8 Pins', '9 Pins', '10 Pins'],
            datasets: [
              {
                label: 'Converted',
                data: filteredSpareRates,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                pointHitRadius: 10,
              },
              {
                label: 'Missed',
                data: filteredMissedCounts,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                pointHitRadius: 10,
              },
            ],
          },
          options: {
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                grid: {
                  color: 'rgba(128, 128, 128, 0.3)',
                },
                angleLines: {
                  color: 'rgba(128, 128, 128, 0.3)',
                },
                pointLabels: {
                  color: 'gray',
                  font: {
                    size: 14,
                  },
                },
                ticks: {
                  backdropColor: 'transparent',
                  color: 'white',
                  display: false,
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  title: function (context) {
                    const value = context[0].raw;

                    const matchingLabels = context[0].chart.data.labels!.filter((label, index) => {
                      return context[0].chart.data.datasets.some((dataset) => dataset.data[index] === value && value === 0);
                    });

                    // Only modify the title if multiple labels match the same value
                    if (matchingLabels.length > 1) {
                      // Extract only the numbers from each label and join them
                      const extractedNumbers = matchingLabels.map((label) => {
                        // Use regex to extract the number part from the label (e.g., "1 Pin" -> "1")
                        const match = (label as string).match(/\d+/);
                        return match ? match[0] : ''; // Return the matched number or an empty string if no match
                      });

                      // Return the combined numbers as the title (e.g., "2, 3 Pins")
                      return extractedNumbers.join(', ') + ' Pins';
                    }

                    // Default behavior: return the original label if only one match
                    return context[0].label || '';
                  },
                  label: function (context) {
                    // Create the base label with dataset name and value percentage
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.r !== null) {
                      label += context.parsed.r + '%';
                    }

                    return label;
                  },
                },
              },
              title: {
                display: true,
                text: 'Converted vs Missed spares',
                color: 'white',
                font: {
                  size: 20,
                },
              },
              legend: {
                display: true,
                labels: {
                  font: {
                    size: 15,
                  },
                },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error('Error generating pin chart:', error);
      throw error;
    }
  }

  generateSpareDistributionChart(
    spareDistributionChart: ElementRef,
    stats: Stats,
    existingChartInstance: Chart | undefined,
    isReload?: boolean,
  ): Chart {
    try {
      const ctx = spareDistributionChart.nativeElement;

      const pinCounts = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
      const appearanceCounts = stats.pinCounts.slice(1).map((count, index) => count + stats.missedCounts[index + 1]);
      const hitCounts = stats.pinCounts.slice(1);

      if (isReload && existingChartInstance) {
        existingChartInstance.destroy();
      }

      if (existingChartInstance && !isReload) {
        existingChartInstance.data.labels = pinCounts;
        existingChartInstance.data.datasets[0].data = appearanceCounts;
        existingChartInstance.data.datasets[1].data = hitCounts;
        existingChartInstance.update();
        return existingChartInstance;
      } else {
        return new Chart(ctx, {
          type: 'bar',
          data: {
            labels: pinCounts,
            datasets: [
              {
                label: 'Appearance Count',
                data: appearanceCounts,
                backgroundColor: 'rgba(153, 102, 255, 0.1)',
                borderColor: 'rgba(153, 102, 255, .5)',
                borderWidth: 1,
              },
              {
                label: 'Hit Count',
                data: hitCounts,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              x: {
                ticks: {
                  font: {
                    size: 14,
                  },
                },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Frequency',
                  color: 'white',
                  font: {
                    size: 16,
                  },
                },
                ticks: {
                  font: {
                    size: 14,
                  },
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: 'Spare Distribution',
                color: 'white',
                font: {
                  size: 20,
                },
              },
              legend: {
                display: true,
                labels: {
                  font: {
                    size: 15,
                  },
                },
              },
              tooltip: {
                callbacks: {
                  title: function (context) {
                    const index = context[0].dataIndex;
                    return `${index + 1} Pin${index + 1 > 1 ? 's' : ''}`;
                  },
                },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error('Error generating spare distribution chart:', error);
      throw error;
    }
  }

  generateThrowChart(throwChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
    try {
      const { opens, spares, strikes } = this.calculateThrowChartData(stats);
      const ctx = throwChart.nativeElement;

      if (isReload && existingChartInstance) {
        existingChartInstance.destroy();
      }

      if (existingChartInstance && !isReload) {
        existingChartInstance.data.datasets[0].data = [spares, strikes, opens];
        existingChartInstance.update();
        return existingChartInstance;
      } else {
        return new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Spare', 'Strike', 'Open'],
            datasets: [
              {
                label: 'Percentage',
                data: [spares, strikes, opens],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(54, 162, 235)',
                pointHitRadius: 10,
              },
            ],
          },
          options: {
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                grid: {
                  color: 'rgba(128, 128, 128, 0.3)',
                  lineWidth: 0.5,
                },
                angleLines: {
                  color: 'rgba(128, 128, 128, 0.3)',
                  lineWidth: 0.5,
                },
                pointLabels: {
                  color: 'gray',
                  font: {
                    size: 14,
                  },
                },
                ticks: {
                  display: false,
                  backdropColor: 'transparent',
                  color: 'white',
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: 'Throw Distribution',
                color: 'white',
                font: {
                  size: 20,
                },
              },
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.r !== null) {
                      label += context.parsed.r + '%';
                    }
                    return label;
                  },
                },
              },
            },
            layout: {
              padding: {
                top: 10,
                bottom: 10,
              },
            },
            elements: {
              line: {
                borderWidth: 2,
              },
            },
          },
        });
      }
    } catch (error) {
      console.error('Error generating throw chart:', error);
      throw error;
    }
  }

  // generatePatternChartDataUri(
  //   pattern: Partial<Pattern>,
  //   svgWidth: number,
  //   svgHeight: number,
  //   viewBoxWidth: number,
  //   viewBoxHeight: number,
  //   pinRadius: number,
  //   pinStrokeWidth: number,
  //   arrowSize: number,
  //   horizontal = false,
  // ): string {
  //   // determine color from ratio
  //   const ratio = parseFloat(pattern.ratio!.split(':')[0]);
  //   let color = 'blue';
  //   if (ratio >= 1 && ratio < 4) {
  //     color = 'red';
  //   } else if (ratio >= 4 && ratio < 8) {
  //     color = '#ed8e07';
  //   } else if (ratio >= 8) {
  //     color = 'green';
  //   }

  //   // 1. Create detached SVG in memory
  //   const tempSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  //   d3.select(tempSvgElement)
  //     .attr('xmlns', 'http://www.w3.org/2000/svg')
  //     .attr('preserveAspectRatio', 'xMidYMid slice')
  //     .attr('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
  //     .style('background-color', 'white');

  //   // margins and drawing area
  //   const margin = { top: 30, right: 10, bottom: 10, left: 30 };
  //   const width = horizontal ? svgWidth - margin.top - margin.bottom : svgWidth - margin.left - margin.right;
  //   const height = horizontal ? svgHeight - margin.left - margin.right : svgHeight - margin.top - margin.bottom;

  //   const g = d3.select(tempSvgElement).append('g');

  //   if (horizontal) {
  //     g.attr('transform', `translate(${margin.left - 4}, ${width + 40}) rotate(-90)`);
  //   } else {
  //     g.attr('transform', `translate(${margin.left}, ${margin.top - 10})`);
  //   }

  //   // Ensure yScale domain includes 60 so yScale(60) is valid in grid/areas/ticks.
  //   const yDomainMax = Math.max(LANE_HEIGHT, 60);

  //   const xScale = d3.scaleLinear().domain([0, LANE_WIDTH]).range([0, width]);
  //   const yScale = d3.scaleLinear().domain([0, yDomainMax]).range([height, 0]);

  //   // vertical grid lines (x)
  //   g.selectAll('.grid-line-x')
  //     .data(d3.range(0, LANE_WIDTH + 1, 1))
  //     .enter()
  //     .append('line')
  //     .attr('class', 'grid-line-x')
  //     .attr('x1', (d) => xScale(d))
  //     .attr('x2', (d) => xScale(d))
  //     .attr('y1', yScale(0))
  //     .attr('y2', yScale(60)) // now valid because yScale domain includes 60
  //     .attr('stroke', 'lightgray')
  //     .attr('stroke-width', 0.5);

  //   // horizontal grid lines up to 60
  //   g.selectAll('.grid-line-y')
  //     .data(d3.range(0, 61, 10))
  //     .enter()
  //     .append('line')
  //     .attr('class', 'grid-line-y')
  //     .attr('x1', 0)
  //     .attr('x2', width)
  //     .attr('y1', (d) => yScale(d))
  //     .attr('y2', (d) => yScale(d))
  //     .attr('stroke', 'lightgray')
  //     .attr('stroke-width', 0.5);

  //   const parseX = (value: string): number => {
  //     const num = parseFloat(value);
  //     if (value.toUpperCase().endsWith('L')) {
  //       return num;
  //     } else if (value.toUpperCase().endsWith('R')) {
  //       return LANE_WIDTH - num;
  //     }
  //     return num;
  //   };

  //   // computeRect: compute pixel width/height robustly via scaled positions
  //   const computeRect = (data: ForwardsData | ReverseData) => {
  //     const xStart = parseX(data.start);
  //     const xEnd = parseX(data.stop);
  //     const rectX = Math.min(xStart, xEnd);
  //     const rectX2 = Math.max(xStart, xEnd);

  //     const yStartVal = parseFloat(data.distance_start);
  //     const yEndVal = parseFloat(data.distance_end);
  //     const rectYVal = Math.min(yStartVal, yEndVal);
  //     const rectYVal2 = Math.max(yStartVal, yEndVal);

  //     const x1px = xScale(rectX);
  //     const x2px = xScale(rectX2);
  //     const y1px = yScale(rectYVal);
  //     const y2px = yScale(rectYVal2);

  //     return {
  //       x: x1px,
  //       y: Math.min(y1px, y2px),
  //       width: Math.abs(x2px - x1px),
  //       height: Math.abs(y2px - y1px),
  //     };
  //   };

  //   // parse oil numbers (unchanged)
  //   const parseOilValue = (oilStr: string): number => {
  //     if (oilStr.includes('.')) {
  //       const parts = oilStr.split('.');
  //       const factor = Math.pow(10, parts[1].length);
  //       return parseFloat(oilStr) * factor;
  //     }
  //     return parseFloat(oilStr);
  //   };

  //   const allOilValues: number[] = [];
  //   if (pattern.forwards_data) {
  //     pattern.forwards_data.forEach((d: ForwardsData) => {
  //       const oilVal = parseOilValue(d.total_oil);
  //       if (oilVal !== 0) allOilValues.push(oilVal);
  //     });
  //   }
  //   if (pattern.reverse_data) {
  //     pattern.reverse_data.forEach((d: ReverseData) => {
  //       const oilVal = parseOilValue(d.total_oil);
  //       if (oilVal !== 0) allOilValues.push(oilVal);
  //     });
  //   }

  //   // Draw forwards_data rects
  //   if (pattern.forwards_data) {
  //     pattern.forwards_data.forEach((d: ForwardsData) => {
  //       if (parseInt(d.total_oil) !== 0) {
  //         const rect = computeRect(d);
  //         g.append('rect')
  //           .attr('x', rect.x)
  //           .attr('y', rect.y)
  //           .attr('width', rect.width)
  //           .attr('height', rect.height)
  //           .attr('fill', color)
  //           .attr('fill-opacity', 0.5);
  //       }
  //     });
  //   }

  //   // Draw reverse_data rects
  //   if (pattern.reverse_data) {
  //     pattern.reverse_data.forEach((d: ReverseData) => {
  //       if (parseInt(d.total_oil) !== 0 || parseFloat(d.distance_end) === 0) {
  //         const rect = computeRect(d);
  //         g.append('rect')
  //           .attr('x', rect.x)
  //           .attr('y', rect.y)
  //           .attr('width', rect.width)
  //           .attr('height', rect.height)
  //           .attr('fill', color)
  //           .attr('fill-opacity', 0.3);
  //       }
  //     });
  //   }

  //   // Use the same yScale for axis that was used for drawing
  //   const yAxis = d3.axisLeft(yScale).tickValues(d3.range(0, 61, 5));
  //   const yAxisG = g.append('g').call(yAxis);
  //   yAxisG.selectAll('line, path').attr('stroke', 'lightgray').attr('stroke-width', 0.5);
  //   yAxisG.selectAll('text').attr('fill', 'black').attr('stroke-width', 0.5);

  //   // compute forward/reverse maxima for area backgrounds
  //   let forwardsMaxDistance = 0;
  //   let reverseMaxDistance = 0;

  //   if (pattern.forwards_data && pattern.forwards_data.length > 0) {
  //     pattern.forwards_data.forEach((d) => {
  //       const distanceStart = parseFloat(d.distance_start);
  //       const distanceEnd = parseFloat(d.distance_end);
  //       forwardsMaxDistance = Math.max(forwardsMaxDistance, distanceStart, distanceEnd);
  //     });
  //   }

  //   if (pattern.reverse_data && pattern.reverse_data.length > 0) {
  //     pattern.reverse_data.forEach((d) => {
  //       const distanceStart = parseFloat(d.distance_start);
  //       const distanceEnd = parseFloat(d.distance_end);
  //       reverseMaxDistance = Math.max(reverseMaxDistance, distanceStart, distanceEnd);
  //     });
  //   }

  //   if (reverseMaxDistance !== forwardsMaxDistance) {
  //     g.append('rect')
  //       .attr('x', xScale(1))
  //       .attr('y', yScale(forwardsMaxDistance))
  //       .attr('width', xScale(LANE_WIDTH - 1) - xScale(1))
  //       .attr('height', yScale(0) - yScale(forwardsMaxDistance))
  //       .attr('fill', color)
  //       .attr('fill-opacity', 0.05);
  //   }

  //   g.append('rect')
  //     .attr('x', xScale(1))
  //     .attr('y', yScale(reverseMaxDistance))
  //     .attr('width', xScale(LANE_WIDTH - 1) - xScale(1))
  //     .attr('height', yScale(0) - yScale(reverseMaxDistance))
  //     .attr('fill', color)
  //     .attr('fill-opacity', 0.1);

  //   // Pins (unchanged positions but using yScale consistently)
  //   const centerX = LANE_WIDTH / 2;
  //   const baseY = 60;
  //   const rowSpacing = 3;
  //   const offset = 11;

  //   const row1 = [{ number: 1, x: centerX, y: baseY }];
  //   const row2 = [
  //     { number: 2, x: centerX - offset / 2, y: baseY + rowSpacing },
  //     { number: 3, x: centerX + offset / 2, y: baseY + rowSpacing },
  //   ];
  //   const row3 = [
  //     { number: 4, x: centerX - offset, y: baseY + 2 * rowSpacing },
  //     { number: 5, x: centerX, y: baseY + 2 * rowSpacing },
  //     { number: 6, x: centerX + offset, y: baseY + 2 * rowSpacing },
  //   ];
  //   const row4 = [
  //     { number: 7, x: centerX - 1.5 * offset, y: baseY + 3 * rowSpacing },
  //     { number: 8, x: centerX - 0.5 * offset, y: baseY + 3 * rowSpacing },
  //     { number: 9, x: centerX + 0.5 * offset, y: baseY + 3 * rowSpacing },
  //     { number: 10, x: centerX + 1.5 * offset, y: baseY + 3 * rowSpacing },
  //   ];

  //   const pins = [...row4, ...row3, ...row2, ...row1];

  //   const pinsGroup = g.append('g').attr('class', 'pins-group');

  //   pinsGroup
  //     .selectAll('.pin')
  //     .data(pins)
  //     .enter()
  //     .append('circle')
  //     .attr('class', 'pin')
  //     .attr('cx', (d) => xScale(d.x))
  //     .attr('cy', (d) => yScale(d.y))
  //     .attr('r', pinRadius)
  //     .attr('fill', 'white')
  //     .attr('stroke', 'black')
  //     .attr('stroke-width', pinStrokeWidth);

  //   // arrows
  //   const arrowPositions = [
  //     { board: 4, distance: 12.5 },
  //     { board: 9, distance: 13.5 },
  //     { board: 14, distance: 14.5 },
  //     { board: 19, distance: 15.5 },
  //     { board: 24, distance: 14.5 },
  //     { board: 29, distance: 13.5 },
  //     { board: 34, distance: 12.5 },
  //   ];

  //   const arrowShape = d3
  //     .symbol()
  //     .type(d3.symbolTriangle)
  //     .size(arrowSize * arrowSize);

  //   g.selectAll('.lane-arrow')
  //     .data(arrowPositions)
  //     .enter()
  //     .append('path')
  //     .attr('class', 'lane-arrow')
  //     .attr('d', arrowShape)
  //     .attr('transform', (d) => `translate(${xScale(d.board)}, ${yScale(d.distance)}) scale(1, 2.5)`)
  //     .attr('fill', 'black')
  //     .attr('stroke', 'none');

  //   const svgString = tempSvgElement.outerHTML;
  //   const encodedString = btoa(unescape(encodeURIComponent(svgString)));
  //   return 'data:image/svg+xml;base64,' + encodedString;
  // }

  generateBallDistributionChart(
    ballDistributionChartCanvas: ElementRef,
    balls: Ball[],
    existingChartInstance: Chart | undefined,
    isReload?: boolean,
  ): Chart {
    try {
      const baseUrl = 'https://bowwwl.com';
      const canvas = ballDistributionChartCanvas.nativeElement as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (existingChartInstance) return existingChartInstance;
        throw new Error('Failed to get canvas context.');
      }

      if (isReload && existingChartInstance) {
        existingChartInstance.destroy();
      }

      const jitter = () => (Math.random() - 0.5) * 0.004;

      const dataPoints: (ScatterDataPoint & { name: string; imageUrl: string; cover: string })[] = [];
      const pointImages: HTMLImageElement[] = [];
      for (const ball of balls) {
        const xRaw = parseFloat(ball.core_diff);
        const yRaw = parseFloat(ball.core_rg);
        if (isNaN(xRaw) || isNaN(yRaw)) {
          console.warn(`Skipping invalid RG/Diff for ${ball.ball_name}`);
          continue;
        }
        const x = xRaw + jitter();
        const y = yRaw + jitter();
        dataPoints.push({ x, y, name: ball.ball_name, imageUrl: baseUrl + ball.thumbnail_image, cover: ball.coverstock_type });

        const img = new Image(70, 70);
        img.src = baseUrl + ball.thumbnail_image;
        img.onerror = () => console.warn(`Failed to load image for ${ball.ball_name}`);
        pointImages.push(img);
      }

      const dataset = {
        label: 'Bowling Balls',
        data: dataPoints,
        pointStyle: pointImages,
        pointHitRadius: 35,
        usePointStyle: true,
        backgroundColor: 'rgba(0,0,0,0)',
      };

      const config: ChartConfiguration<'scatter'> = {
        type: 'scatter',
        data: { datasets: [dataset] },
        plugins: [zoomPlugin, ballDistributionZonePlugin, customAxisTitlesPlugin],

        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              bottom: 20,
              left: 20,
              right: 0,
            },
            autoPadding: false,
          },
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              ticks: {
                color: 'white',
                callback: (v) => Number(v).toFixed(3),
                font: { size: 8 },
              },
              grid: { color: 'rgba(255,255,255,0.2)', drawOnChartArea: false },
              min: 0.015,
              max: 0.073,
            },
            y: {
              ticks: {
                color: 'white',
                callback: (v) => Number(v).toFixed(3),
                font: { size: 8 },
              },
              grid: { color: 'rgba(255,255,255,0.2)', drawOnChartArea: false },
              min: 2.35,
              max: 2.75,
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0,0,0,0.85)',
              titleFont: { size: 14, weight: 'bold' },
              mode: 'nearest',
              bodyFont: { size: 12 },
              padding: 10,
              displayColors: false,
              callbacks: {
                title: (items) => (items[0]?.raw as { name: string }).name || '',
                label: (context) => {
                  const dp = context.raw as ScatterDataPoint & { cover: string };
                  const x = dp.x;
                  const y = dp.y;

                  let rollCat: string;
                  if (y < 2.52) {
                    rollCat = 'Early Roll';
                  } else if (y < 2.58) {
                    rollCat = 'Medium Roll';
                  } else {
                    rollCat = 'Later Roll';
                  }

                  let flareCat: string;
                  if (x < 0.035) {
                    flareCat = 'Low Flare';
                  } else if (x < 0.05) {
                    flareCat = 'Medium Flare';
                  } else {
                    flareCat = 'High Flare';
                  }

                  return [`RG: ${y.toFixed(3)}`, `Diff: ${x.toFixed(3)}`, `Cover: ${dp.cover}`, rollCat, flareCat];
                },
              },
            },
            zoom: {
              zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: 'xy',
              },
              pan: {
                enabled: true,
                mode: 'xy',
                onPanStart: ({ chart, event }) => {
                  const { left, right, top, bottom } = chart.chartArea;
                  const panEvent = event as unknown as { center: { x: number; y: number } };
                  return (
                    panEvent.center.x >= left + 25 && panEvent.center.x <= right + 30 && panEvent.center.y >= top && panEvent.center.y <= bottom + 50
                  );
                },
              },
            },
          },
        },
      };

      if (existingChartInstance && !isReload) {
        existingChartInstance.data.datasets[0] = dataset;
        if (existingChartInstance.options.scales) {
          existingChartInstance.options.scales['x'] = config.options?.scales?.['x'];
          existingChartInstance.options.scales['y'] = config.options?.scales?.['y'];
        }
        existingChartInstance.update();
        return existingChartInstance;
      } else {
        return new Chart(ctx, config);
      }
    } catch (err) {
      console.error('Error generating chart:', err);
      if (existingChartInstance) return existingChartInstance;
      throw err;
    }
  }

  public calculateScoreChartData(gameHistory: Game[], viewMode: 'week' | 'game' | 'monthly' | 'yearly' = 'game') {
    if (viewMode === 'week') {
      return this.calculateWeeklyScoreChartData(gameHistory);
    } else if (viewMode === 'monthly') {
      return this.calculateMonthlyScoreChartData(gameHistory);
    } else if (viewMode === 'yearly') {
      return this.calculateYearlyScoreChartData(gameHistory);
    } else {
      return this.calculatePerGameScoreChartData(gameHistory);
    }
  }

  private calculatePerGameScoreChartData(gameHistory: Game[]) {
    const scoresByDate: Record<string, number[]> = {};
    gameHistory.forEach((game: Game) => {
      const date = new Date(game.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
      if (!scoresByDate[date]) {
        scoresByDate[date] = [];
      }
      scoresByDate[date].push(game.totalScore);
    });

    const sortedDates = Object.keys(scoresByDate).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('.').map(Number);
      const [dayB, monthB, yearB] = b.split('.').map(Number);
      return new Date(2000 + yearA, monthA - 1, dayA).getTime() - new Date(2000 + yearB, monthB - 1, dayB).getTime();
    });

    const gameLabels = sortedDates;
    let cumulativeSum = 0;
    let cumulativeCount = 0;

    const overallAverages = gameLabels.map((date) => {
      cumulativeSum += scoresByDate[date].reduce((sum, score) => sum + score, 0);
      cumulativeCount += scoresByDate[date].length;
      return cumulativeSum / cumulativeCount;
    });

    const differences = gameLabels.map((date, index) => {
      const dailySum = scoresByDate[date].reduce((sum, score) => sum + score, 0);
      const dailyAverage = dailySum / scoresByDate[date].length;
      return dailyAverage - overallAverages[index];
    });

    const formattedAverages = overallAverages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
    const formattedDifferences = differences.map((difference) => parseFloat(new DecimalPipe('en').transform(difference, '1.2-2')!));
    const gamesPlayedDaily = gameLabels.map((date) => scoresByDate[date].length);

    return { gameLabels, overallAverages: formattedAverages, differences: formattedDifferences, gamesPlayedDaily };
  }

  private calculateWeeklyScoreChartData(gameHistory: Game[]) {
    try {
      const scoresByWeek: Record<string, number[]> = {};
      gameHistory.forEach((game: Game) => {
        const startOfWeek = this.getStartOfWeek(new Date(game.date));
        const weekKey = startOfWeek.toISOString().split('T')[0];

        if (!scoresByWeek[weekKey]) {
          scoresByWeek[weekKey] = [];
        }
        scoresByWeek[weekKey].push(game.totalScore);
      });

      const sortedWeekKeys = Object.keys(scoresByWeek).sort();

      const gameLabels = sortedWeekKeys.map((weekKey) => {
        const startDate = new Date(weekKey);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const startDateFormatted = startDate.toLocaleDateString(undefined, {
          day: '2-digit',
          month: '2-digit',
        });

        const endDateFormatted = endDate.toLocaleDateString(undefined, {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        });

        return `${startDateFormatted} - ${endDateFormatted}`;
      });

      let cumulativeSum = 0;
      let cumulativeCount = 0;

      const overallAverages = sortedWeekKeys.map((weekKey) => {
        cumulativeSum += scoresByWeek[weekKey].reduce((sum, score) => sum + score, 0);
        cumulativeCount += scoresByWeek[weekKey].length;
        return cumulativeSum / cumulativeCount;
      });

      const differences = sortedWeekKeys.map((weekKey, index) => {
        const weeklySum = scoresByWeek[weekKey].reduce((sum, score) => sum + score, 0);
        const weeklyAverage = weeklySum / scoresByWeek[weekKey].length;
        return weeklyAverage - overallAverages[index];
      });

      const formattedAverages = overallAverages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
      const formattedDifferences = differences.map((difference) => parseFloat(new DecimalPipe('en').transform(difference, '1.2-2')!));

      const gamesPlayedWeekly = sortedWeekKeys.map((weekKey) => scoresByWeek[weekKey].length);

      return { gameLabels, overallAverages: formattedAverages, differences: formattedDifferences, gamesPlayedDaily: gamesPlayedWeekly };
    } catch (error) {
      console.error('Error calculating score chart data:', error);
      throw error;
    }
  }

  private calculateMonthlyScoreChartData(gameHistory: Game[]) {
    try {
      const scoresByMonth: Record<string, number[]> = {};
      gameHistory.forEach((game: Game) => {
        const gameDate = new Date(game.date);
        const monthKey = `${gameDate.getFullYear()}-${(gameDate.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!scoresByMonth[monthKey]) {
          scoresByMonth[monthKey] = [];
        }
        scoresByMonth[monthKey].push(game.totalScore);
      });

      const sortedMonthKeys = Object.keys(scoresByMonth).sort();

      const gameLabels = sortedMonthKeys.map((monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
        });
      });

      let cumulativeSum = 0;
      let cumulativeCount = 0;

      const overallAverages = sortedMonthKeys.map((monthKey) => {
        cumulativeSum += scoresByMonth[monthKey].reduce((sum, score) => sum + score, 0);
        cumulativeCount += scoresByMonth[monthKey].length;
        return cumulativeSum / cumulativeCount;
      });

      const differences = sortedMonthKeys.map((monthKey, index) => {
        const monthlySum = scoresByMonth[monthKey].reduce((sum, score) => sum + score, 0);
        const monthlyAverage = monthlySum / scoresByMonth[monthKey].length;
        return monthlyAverage - overallAverages[index];
      });

      const formattedAverages = overallAverages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
      const formattedDifferences = differences.map((difference) => parseFloat(new DecimalPipe('en').transform(difference, '1.2-2')!));
      const gamesPlayedMonthly = sortedMonthKeys.map((monthKey) => scoresByMonth[monthKey].length);

      return { gameLabels, overallAverages: formattedAverages, differences: formattedDifferences, gamesPlayedDaily: gamesPlayedMonthly };
    } catch (error) {
      console.error('Error calculating monthly score chart data:', error);
      throw error;
    }
  }

  private calculatePinChartData(stats: Stats) {
    try {
      const filteredSpareRates: number[] = stats.spareRates.slice(1).map((rate) => parseFloat(new DecimalPipe('en').transform(rate, '1.2-2')!));
      const filteredMissedCounts: number[] = stats.missedCounts.slice(1).map((count, i) => {
        const rate = this.getRate(count, stats.pinCounts[i + 1]);
        const transformedRate = new DecimalPipe('en').transform(rate, '1.2-2');
        return parseFloat(transformedRate ?? '0');
      });
      return { filteredSpareRates, filteredMissedCounts };
    } catch (error) {
      console.error('Error calculating pin chart data:', error);
      throw error;
    }
  }

  private calculateThrowChartData(stats: Stats) {
    try {
      const opens = parseFloat(new DecimalPipe('en').transform(stats.openPercentage, '1.2-2')!);
      const spares = parseFloat(new DecimalPipe('en').transform(stats.sparePercentage, '1.2-2')!);
      const strikes = parseFloat(new DecimalPipe('en').transform(stats.strikePercentage, '1.2-2')!);
      return { opens, spares, strikes };
    } catch (error) {
      console.error('Error calculating throw chart data:', error);
      throw error;
    }
  }

  private getRate(converted: number, missed: number): number {
    try {
      if (converted + missed === 0) {
        return 0;
      }
      return (converted / (converted + missed)) * 100;
    } catch (error) {
      console.error('Error calculating rate:', error);
      throw error;
    }
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(d.setDate(diff));
  }

  private calculateYearlyScoreChartData(gameHistory: Game[]) {
    try {
      const scoresByYear: Record<string, number[]> = {};
      gameHistory.forEach((game: Game) => {
        const gameDate = new Date(game.date);
        const yearKey = gameDate.getFullYear().toString();

        if (!scoresByYear[yearKey]) {
          scoresByYear[yearKey] = [];
        }
        scoresByYear[yearKey].push(game.totalScore);
      });

      const sortedYearKeys = Object.keys(scoresByYear).sort();

      const gameLabels = sortedYearKeys;

      let cumulativeSum = 0;
      let cumulativeCount = 0;

      const overallAverages = sortedYearKeys.map((yearKey) => {
        cumulativeSum += scoresByYear[yearKey].reduce((sum, score) => sum + score, 0);
        cumulativeCount += scoresByYear[yearKey].length;
        return cumulativeSum / cumulativeCount;
      });

      const differences = sortedYearKeys.map((yearKey, index) => {
        const yearlySum = scoresByYear[yearKey].reduce((sum, score) => sum + score, 0);
        const yearlyAverage = yearlySum / scoresByYear[yearKey].length;
        return yearlyAverage - overallAverages[index];
      });

      const formattedAverages = overallAverages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
      const formattedDifferences = differences.map((difference) => parseFloat(new DecimalPipe('en').transform(difference, '1.2-2')!));
      const gamesPlayedYearly = sortedYearKeys.map((yearKey) => scoresByYear[yearKey].length);

      return { gameLabels, overallAverages: formattedAverages, differences: formattedDifferences, gamesPlayedDaily: gamesPlayedYearly };
    } catch (error) {
      console.error('Error calculating yearly score chart data:', error);
      throw error;
    }
  }

  public calculateAverageScoreChartData(gameHistory: Game[], viewMode: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
    if (viewMode === 'daily') {
      return this.calculateDailyAverageScoreData(gameHistory);
    } else if (viewMode === 'weekly') {
      return this.calculateWeeklyAverageScoreData(gameHistory);
    } else if (viewMode === 'monthly') {
      return this.calculateMonthlyAverageScoreData(gameHistory);
    } else {
      return this.calculateYearlyAverageScoreData(gameHistory);
    }
  }

  private calculateDailyAverageScoreData(gameHistory: Game[]) {
    try {
      const scoresByDate: Record<string, number[]> = {};
      gameHistory.forEach((game: Game) => {
        const date = new Date(game.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
        if (!scoresByDate[date]) {
          scoresByDate[date] = [];
        }
        scoresByDate[date].push(game.totalScore);
      });

      const sortedDates = Object.keys(scoresByDate).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('.').map(Number);
        const [dayB, monthB, yearB] = b.split('.').map(Number);
        return new Date(2000 + yearA, monthA - 1, dayA).getTime() - new Date(2000 + yearB, monthB - 1, dayB).getTime();
      });

      const gameLabels = sortedDates;
      const averages = sortedDates.map((date) => {
        const dailySum = scoresByDate[date].reduce((sum, score) => sum + score, 0);
        return dailySum / scoresByDate[date].length;
      });

      const formattedAverages = averages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
      const gamesPlayedDaily = sortedDates.map((date) => scoresByDate[date].length);

      return { gameLabels, averages: formattedAverages, gamesPlayedDaily };
    } catch (error) {
      console.error('Error calculating daily average score data:', error);
      throw error;
    }
  }

  private calculateWeeklyAverageScoreData(gameHistory: Game[]) {
    try {
      const scoresByWeek: Record<string, number[]> = {};
      gameHistory.forEach((game: Game) => {
        const gameDate = new Date(game.date);
        const startOfWeek = this.getStartOfWeek(gameDate);
        const weekKey = startOfWeek.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

        if (!scoresByWeek[weekKey]) {
          scoresByWeek[weekKey] = [];
        }
        scoresByWeek[weekKey].push(game.totalScore);
      });

      const sortedWeekKeys = Object.keys(scoresByWeek).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('.').map(Number);
        const [dayB, monthB, yearB] = b.split('.').map(Number);
        return new Date(2000 + yearA, monthA - 1, dayA).getTime() - new Date(2000 + yearB, monthB - 1, dayB).getTime();
      });

      const gameLabels = sortedWeekKeys.map((weekKey) => {
        const [day, month, year] = weekKey.split('.').map(Number);
        const startDate = new Date(2000 + year, month - 1, day);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        return `${startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`;
      });

      const averages = sortedWeekKeys.map((weekKey) => {
        const weeklySum = scoresByWeek[weekKey].reduce((sum, score) => sum + score, 0);
        return weeklySum / scoresByWeek[weekKey].length;
      });

      const formattedAverages = averages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
      const gamesPlayedWeekly = sortedWeekKeys.map((weekKey) => scoresByWeek[weekKey].length);

      return { gameLabels, averages: formattedAverages, gamesPlayedDaily: gamesPlayedWeekly };
    } catch (error) {
      console.error('Error calculating weekly average score data:', error);
      throw error;
    }
  }

  private calculateMonthlyAverageScoreData(gameHistory: Game[]) {
    try {
      const scoresByMonth: Record<string, number[]> = {};
      gameHistory.forEach((game: Game) => {
        const gameDate = new Date(game.date);
        const monthKey = `${gameDate.getFullYear()}-${(gameDate.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!scoresByMonth[monthKey]) {
          scoresByMonth[monthKey] = [];
        }
        scoresByMonth[monthKey].push(game.totalScore);
      });

      const sortedMonthKeys = Object.keys(scoresByMonth).sort();

      const gameLabels = sortedMonthKeys.map((monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
        });
      });

      const averages = sortedMonthKeys.map((monthKey) => {
        const monthlySum = scoresByMonth[monthKey].reduce((sum, score) => sum + score, 0);
        return monthlySum / scoresByMonth[monthKey].length;
      });

      const formattedAverages = averages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
      const gamesPlayedMonthly = sortedMonthKeys.map((monthKey) => scoresByMonth[monthKey].length);

      return { gameLabels, averages: formattedAverages, gamesPlayedDaily: gamesPlayedMonthly };
    } catch (error) {
      console.error('Error calculating monthly average score data:', error);
      throw error;
    }
  }

  private calculateYearlyAverageScoreData(gameHistory: Game[]) {
    try {
      const scoresByYear: Record<string, number[]> = {};
      gameHistory.forEach((game: Game) => {
        const gameDate = new Date(game.date);
        const yearKey = gameDate.getFullYear().toString();

        if (!scoresByYear[yearKey]) {
          scoresByYear[yearKey] = [];
        }
        scoresByYear[yearKey].push(game.totalScore);
      });

      const sortedYearKeys = Object.keys(scoresByYear).sort();

      const gameLabels = sortedYearKeys;

      const averages = sortedYearKeys.map((yearKey) => {
        const yearlySum = scoresByYear[yearKey].reduce((sum, score) => sum + score, 0);
        return yearlySum / scoresByYear[yearKey].length;
      });

      const formattedAverages = averages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));
      const gamesPlayedYearly = sortedYearKeys.map((yearKey) => scoresByYear[yearKey].length);

      return { gameLabels, averages: formattedAverages, gamesPlayedDaily: gamesPlayedYearly };
    } catch (error) {
      console.error('Error calculating yearly average score data:', error);
      throw error;
    }
  }
}
