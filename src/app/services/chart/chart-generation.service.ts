import { ElementRef, Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Game } from 'src/app/models/game.model';
import { Stats } from 'src/app/models/stats.model';
import Chart from 'chart.js/auto';

@Injectable({
  providedIn: 'root',
})
export class ChartGenerationService {
  constructor() {}

  generateScoreChart(scoreChart: ElementRef, games: Game[], existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
    const { gameLabels, overallAverages, differences, gamesPlayedDaily } = this.calculateScoreChartData(games);
    const ctx = scoreChart.nativeElement;
    let chartInstance: Chart;

    if (isReload && existingChartInstance) {
      existingChartInstance.destroy();
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
              label: 'Average',
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
        options: {
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 300,
              ticks: {
                font: {
                  size: 14,
                },
              },
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false,
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
              text: 'Score analysis',
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
              onClick: (e, legendItem) => {
                const index = legendItem.datasetIndex!;
                const ci = chartInstance;
                if (!ci) {
                  console.error('Chart instance is not defined.');
                  return;
                }
                const meta = ci.getDatasetMeta(index);
                meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : !meta.hidden;
                const gamesPlayedIndex = ci.data.datasets.findIndex((dataset) => dataset.label === 'Games played');
                if (gamesPlayedIndex !== -1) {
                  const gamesPlayedMeta = ci.getDatasetMeta(gamesPlayedIndex);
                  const isGamesPlayedHidden = gamesPlayedMeta.hidden;
                  if (ci.options.scales && ci.options.scales['y1']) {
                    ci.options.scales['y1'].display = !isGamesPlayedHidden;
                  }
                }
                ci.update();
              },
            },
          },
        },
      });
      return chartInstance;
    }
  }

  generatePinChart(pinChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
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
  }

  generateThrowChart(throwChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
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
              text: 'Throw distribution',
              color: 'white',
              font: {
                size: 20,
              },
            },
            legend: {
              display: false,
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
  }
  private calculateScoreChartData(gameHistory: Game[]) {
    const scoresByDate: { [date: string]: number[] } = {};
    gameHistory.forEach((game: any) => {
      const date = new Date(game.date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      if (!scoresByDate[date]) {
        scoresByDate[date] = [];
      }
      scoresByDate[date].push(game.totalScore);
    });

    const gameLabels = Object.keys(scoresByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulativeSum = 0;
    let cumulativeCount = 0;

    const overallAverages = gameLabels.map((date) => {
      cumulativeSum += scoresByDate[date].reduce((sum, score) => sum + score, 0);
      cumulativeCount += scoresByDate[date].length;
      return cumulativeSum / cumulativeCount;
    });
    overallAverages.map((average) => parseFloat(new DecimalPipe('en').transform(average, '1.2-2')!));

    const differences = gameLabels.map((date, index) => {
      const dailySum = scoresByDate[date].reduce((sum, score) => sum + score, 0);
      const dailyAverage = dailySum / scoresByDate[date].length;
      return dailyAverage - overallAverages[index];
    });
    differences.map((difference) => parseFloat(new DecimalPipe('en').transform(difference, '1.2-2')!));

    const gamesPlayedDaily = gameLabels.map((date) => scoresByDate[date].length);
    return { gameLabels, overallAverages, differences, gamesPlayedDaily };
  }

  private calculatePinChartData(stats: Stats) {
    const filteredSpareRates: number[] = stats.spareRates.slice(1).map((rate) => parseFloat(new DecimalPipe('en').transform(rate, '1.2-2')!));
    const filteredMissedCounts: number[] = stats.missedCounts.slice(1).map((count, i) => {
      const rate = this.getRate(count, stats.pinCounts[i + 1]);
      const transformedRate = new DecimalPipe('en').transform(rate, '1.2-2');
      return parseFloat(transformedRate ?? '0');
    });
    return { filteredSpareRates, filteredMissedCounts };
  }

  private calculateThrowChartData(stats: Stats) {
    const opens = parseFloat(new DecimalPipe('en').transform(stats.openPercentage, '1.2-2')!);
    const spares = parseFloat(new DecimalPipe('en').transform(stats.sparePercentage, '1.2-2')!);
    const strikes = parseFloat(new DecimalPipe('en').transform(stats.strikePercentage, '1.2-2')!);
    return { opens, spares, strikes };
  }

  private getRate(converted: number, missed: number): number {
    if (converted + missed === 0) {
      return 0;
    }
    return (converted / (converted + missed)) * 100;
  }
}
