import { ElementRef } from '@angular/core';
import Chart, { ChartConfiguration, ScatterDataPoint } from 'chart.js/auto';
import { LeaveStats } from 'src/app/core/models/stats.model';

/**
 * Leave category types for grouping leaves
 */
export enum LeaveCategory {
  SinglePin = 'Single Pin',
  BabySplit = 'Baby Split',
  BigSplit = 'Big Split',
  Bucket = 'Bucket/Cluster',
  Washout = 'Washout',
  Miscellaneous = 'Miscellaneous',
}

/**
 * Categorized leave data
 */
export interface CategorizedLeave {
  category: LeaveCategory;
  leaves: LeaveStats[];
  totalOccurrences: number;
  totalPickups: number;
  pickupPercentage: number;
}

/**
 * Categorizes a leave into a specific category based on pin pattern
 */
export function categorizeLeave(pins: number[]): LeaveCategory {
  const sorted = [...pins].sort((a, b) => a - b);
  const count = sorted.length;

  // Single pins
  if (count === 1) {
    return LeaveCategory.SinglePin;
  }

  // Baby splits (common convertible splits)
  const babySplits = [
    [2, 7],
    [3, 10],
    [4, 10],
    [6, 7],
  ];
  if (babySplits.some((split) => sorted.length === split.length && sorted.every((pin, i) => pin === split[i]))) {
    return LeaveCategory.BabySplit;
  }

  // Big/difficult splits
  const bigSplits = [
    [7, 10],
    [4, 6],
    [4, 6, 7],
    [4, 6, 7, 10],
    [6, 7, 10],
    [4, 6, 10],
    [4, 7, 10],
  ];
  if (bigSplits.some((split) => sorted.length === split.length && sorted.every((pin, i) => pin === split[i]))) {
    return LeaveCategory.BigSplit;
  }

  // Washouts (containing 1 and corner pins)
  const washouts = [
    [1, 2, 10],
    [1, 3, 7],
    [1, 2, 4, 10],
    [1, 3, 6, 7],
  ];
  if (washouts.some((washout) => sorted.length === washout.length && sorted.every((pin, i) => pin === washout[i]))) {
    return LeaveCategory.Washout;
  }

  // Buckets/clusters (4+ pins forming a cluster)
  if (count >= 4) {
    return LeaveCategory.Bucket;
  }

  // Everything else
  return LeaveCategory.Miscellaneous;
}

/**
 * Groups leaves by category
 */
export function groupLeavesByCategory(leaves: LeaveStats[]): CategorizedLeave[] {
  const categoryMap = new Map<LeaveCategory, LeaveStats[]>();

  // Initialize all categories
  Object.values(LeaveCategory).forEach((category) => {
    categoryMap.set(category as LeaveCategory, []);
  });

  // Categorize each leave
  leaves.forEach((leave) => {
    const category = categorizeLeave(leave.pins);
    categoryMap.get(category)!.push(leave);
  });

  // Calculate stats for each category
  return Array.from(categoryMap.entries()).map(([category, categoryLeaves]) => {
    const totalOccurrences = categoryLeaves.reduce((sum, l) => sum + l.occurrences, 0);
    const totalPickups = categoryLeaves.reduce((sum, l) => sum + l.pickups, 0);
    const pickupPercentage = totalOccurrences > 0 ? (totalPickups / totalOccurrences) * 100 : 0;

    return {
      category,
      leaves: categoryLeaves,
      totalOccurrences,
      totalPickups,
      pickupPercentage,
    };
  });
}

/**
 * Formats pin array as bowling notation (e.g., [7, 10] -> "7-10")
 */
export function formatPinLeave(pins: number[]): string {
  return pins.sort((a, b) => a - b).join('-');
}

/**
 * Generate category frequency chart
 * Shows how often each type of leave occurs
 */
export function generateLeaveCategoryFrequencyChart(
  chartRef: ElementRef,
  leaves: LeaveStats[],
  existingChartInstance: Chart | undefined,
  isReload?: boolean,
): Chart {
  if (isReload && existingChartInstance) {
    existingChartInstance.destroy();
  }

  const categorized = groupLeavesByCategory(leaves).filter((cat) => cat.totalOccurrences > 0);

  const ctx = chartRef.nativeElement;
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: categorized.map((cat) => cat.category),
      datasets: [
        {
          label: 'Occurrences',
          data: categorized.map((cat) => cat.totalOccurrences),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Leave Frequency by Category',
          font: { size: 16, weight: 'bold' },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            afterLabel: (context) => {
              const cat = categorized[context.dataIndex];
              return `Pickup Rate: ${cat.pickupPercentage.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Occurrences',
          },
        },
      },
    },
  };

  return new Chart(ctx, config);
}

/**
 * Generate category pickup percentage chart
 * Shows conversion rate by leave type
 */
export function generateLeaveCategoryPickupChart(
  chartRef: ElementRef,
  leaves: LeaveStats[],
  existingChartInstance: Chart | undefined,
  isReload?: boolean,
): Chart {
  if (isReload && existingChartInstance) {
    existingChartInstance.destroy();
  }

  const categorized = groupLeavesByCategory(leaves).filter((cat) => cat.totalOccurrences > 0);

  const ctx = chartRef.nativeElement;
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: categorized.map((cat) => cat.category),
      datasets: [
        {
          label: 'Pickup %',
          data: categorized.map((cat) => cat.pickupPercentage),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pickup Percentage by Category',
          font: { size: 16, weight: 'bold' },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y.toFixed(1)}%`,
            afterLabel: (context) => {
              const cat = categorized[context.dataIndex];
              return [`Pickups: ${cat.totalPickups}/${cat.totalOccurrences}`, `Unique leaves: ${cat.leaves.length}`];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Pickup Percentage',
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
    },
  };

  return new Chart(ctx, config);
}

/**
 * Generate top N most common leaves chart
 */
export function generateTopCommonLeavesChart(
  chartRef: ElementRef,
  leaves: LeaveStats[],
  existingChartInstance: Chart | undefined,
  topN = 10,
  isReload?: boolean,
): Chart {
  if (isReload && existingChartInstance) {
    existingChartInstance.destroy();
  }

  const topLeaves = [...leaves].sort((a, b) => b.occurrences - a.occurrences).slice(0, topN);

  const ctx = chartRef.nativeElement;
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: topLeaves.map((leave) => formatPinLeave(leave.pins)),
      datasets: [
        {
          label: 'Occurrences',
          data: topLeaves.map((leave) => leave.occurrences),
          backgroundColor: 'rgba(255, 159, 64, 0.8)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: `Top ${topN} Most Common Leaves`,
          font: { size: 16, weight: 'bold' },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            afterLabel: (context) => {
              const leave = topLeaves[context.dataIndex];
              return [`Pickups: ${leave.pickups}/${leave.occurrences}`, `Pickup Rate: ${leave.pickupPercentage.toFixed(1)}%`];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Occurrences',
          },
        },
      },
    },
  };

  return new Chart(ctx, config);
}

/**
 * Generate top N worst pickup percentage chart
 */
export function generateTopWorstLeavesChart(
  chartRef: ElementRef,
  leaves: LeaveStats[],
  existingChartInstance: Chart | undefined,
  topN = 10,
  isReload?: boolean,
): Chart {
  if (isReload && existingChartInstance) {
    existingChartInstance.destroy();
  }

  // Filter leaves with at least 2 occurrences and sort by pickup percentage (ascending)
  const worstLeaves = leaves
    .filter((leave) => leave.occurrences >= 2)
    .sort((a, b) => a.pickupPercentage - b.pickupPercentage)
    .slice(0, topN);

  const ctx = chartRef.nativeElement;
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: worstLeaves.map((leave) => formatPinLeave(leave.pins)),
      datasets: [
        {
          label: 'Pickup %',
          data: worstLeaves.map((leave) => leave.pickupPercentage),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: `Top ${topN} Hardest Leaves`,
          font: { size: 16, weight: 'bold' },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.x.toFixed(1)}%`,
            afterLabel: (context) => {
              const leave = worstLeaves[context.dataIndex];
              return [`Pickups: ${leave.pickups}/${leave.occurrences}`, `Misses: ${leave.occurrences - leave.pickups}`];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Pickup Percentage',
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
    },
  };

  return new Chart(ctx, config);
}

/**
 * Generate scatter plot: frequency vs pickup percentage
 * Shows all leaves with smart labeling for outliers
 */
export function generateLeaveScatterChart(
  chartRef: ElementRef,
  leaves: LeaveStats[],
  existingChartInstance: Chart | undefined,
  isReload?: boolean,
): Chart {
  if (isReload && existingChartInstance) {
    existingChartInstance.destroy();
  }

  // Prepare scatter data
  const scatterData: ScatterDataPoint[] = leaves.map((leave) => ({
    x: leave.occurrences,
    y: leave.pickupPercentage,
  }));

  // Determine which points to label (top 5 most common + worst 5 + best 5)
  const topCommon = [...leaves].sort((a, b) => b.occurrences - a.occurrences).slice(0, 5);
  const worstPickup = [...leaves]
    .filter((l) => l.occurrences >= 2)
    .sort((a, b) => a.pickupPercentage - b.pickupPercentage)
    .slice(0, 5);
  const bestPickup = [...leaves]
    .filter((l) => l.occurrences >= 2)
    .sort((a, b) => b.pickupPercentage - a.pickupPercentage)
    .slice(0, 5);

  const labelSet = new Set([...topCommon, ...worstPickup, ...bestPickup]);

  const ctx = chartRef.nativeElement;
  const config: ChartConfiguration<'scatter'> = {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Leaves',
          data: scatterData,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
          pointRadius: (context) => {
            const leave = leaves[context.dataIndex];
            return labelSet.has(leave) ? 6 : 4;
          },
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Leave Analysis: Frequency vs Pickup Rate',
          font: { size: 16, weight: 'bold' },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (context) => {
              const leave = leaves[context[0].dataIndex];
              return formatPinLeave(leave.pins);
            },
            label: (context) => {
              const leave = leaves[context.dataIndex];
              return [`Occurrences: ${leave.occurrences}`, `Pickups: ${leave.pickups}`, `Pickup Rate: ${leave.pickupPercentage.toFixed(1)}%`];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Occurrences',
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Pickup Percentage',
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
    },
  };

  return new Chart(ctx, config);
}

/**
 * Generate Pareto chart showing which leaves cause the most misses
 * This helps identify practice priorities
 */
export function generateLeaveParetoChart(
  chartRef: ElementRef,
  leaves: LeaveStats[],
  existingChartInstance: Chart | undefined,
  topN = 15,
  isReload?: boolean,
): Chart {
  if (isReload && existingChartInstance) {
    existingChartInstance.destroy();
  }

  // Calculate missed occurrences and sort
  const leavesWithMisses = leaves
    .map((leave) => ({
      ...leave,
      missedOccurrences: leave.occurrences - leave.pickups,
    }))
    .filter((leave) => leave.missedOccurrences > 0)
    .sort((a, b) => b.missedOccurrences - a.missedOccurrences)
    .slice(0, topN);

  // Calculate cumulative percentage
  const totalMisses = leavesWithMisses.reduce((sum, leave) => sum + leave.missedOccurrences, 0);
  let cumulative = 0;
  const cumulativePercentages = leavesWithMisses.map((leave) => {
    cumulative += leave.missedOccurrences;
    return (cumulative / totalMisses) * 100;
  });

  const ctx = chartRef.nativeElement;
  const config: ChartConfiguration<'bar' | 'line'> = {
    type: 'bar',
    data: {
      labels: leavesWithMisses.map((leave) => formatPinLeave(leave.pins)),
      datasets: [
        {
          type: 'bar',
          label: 'Missed Attempts',
          data: leavesWithMisses.map((leave) => leave.missedOccurrences),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Cumulative %',
          data: cumulativePercentages,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y1',
          pointRadius: 3,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pareto Analysis: Where to Focus Practice',
          font: { size: 16, weight: 'bold' },
        },
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            afterLabel: (context) => {
              if (context.datasetIndex === 0) {
                const leave = leavesWithMisses[context.dataIndex];
                return [`Total Attempts: ${leave.occurrences}`, `Pickups: ${leave.pickups}`, `Pickup Rate: ${leave.pickupPercentage.toFixed(1)}%`];
              }
              return [];
            },
          },
        },
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Missed Attempts',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          max: 100,
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'Cumulative %',
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
    },
  };

  return new Chart(ctx, config);
}

/**
 * Generate practice priority chart
 * Shows leaves with high frequency AND low pickup rate (best practice targets)
 */
export function generatePracticePriorityChart(
  chartRef: ElementRef,
  leaves: LeaveStats[],
  existingChartInstance: Chart | undefined,
  topN = 10,
  isReload?: boolean,
): Chart {
  if (isReload && existingChartInstance) {
    existingChartInstance.destroy();
  }

  // Calculate practice priority score: high occurrences + low pickup rate = high priority
  const priorityLeaves = leaves
    .filter((leave) => leave.occurrences >= 3) // Only significant leaves
    .map((leave) => ({
      ...leave,
      priorityScore: leave.occurrences * (100 - leave.pickupPercentage), // Higher score = more practice needed
      potentialGain: leave.occurrences - leave.pickups, // How many pins could be gained
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, topN);

  const ctx = chartRef.nativeElement;
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: priorityLeaves.map((leave) => formatPinLeave(leave.pins)),
      datasets: [
        {
          label: 'Potential Gain (Misses)',
          data: priorityLeaves.map((leave) => leave.potentialGain),
          backgroundColor: 'rgba(255, 206, 86, 0.8)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'Top Practice Priorities',
          font: { size: 16, weight: 'bold' },
        },
        subtitle: {
          display: true,
          text: 'Leaves with high frequency and low conversion rate',
          font: { size: 12 },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            afterLabel: (context) => {
              const leave = priorityLeaves[context.dataIndex];
              return [
                `Occurrences: ${leave.occurrences}`,
                `Pickup Rate: ${leave.pickupPercentage.toFixed(1)}%`,
                `Pickups: ${leave.pickups}/${leave.occurrences}`,
                `Priority Score: ${leave.priorityScore.toFixed(0)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Potential Pins to Gain',
          },
        },
      },
    },
  };

  return new Chart(ctx, config);
}
