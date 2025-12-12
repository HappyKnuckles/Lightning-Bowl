import { ElementRef, Injectable } from '@angular/core';
import Chart from 'chart.js/auto';
import { Game } from 'src/app/core/models/game.model';
import { LeaveStats, Stats } from 'src/app/core/models/stats.model';
import { Ball } from '../../models/ball.model';

import { generateScoreChart, generateScoreDistributionChart, generateAverageScoreChart } from './generation/score-chart-generator';
import { generatePinChart, generateSpareDistributionChart } from './generation/pin-spare-chart-generator';
import { generateThrowChart } from './generation/throw-chart-generator';
import { generateBallDistributionChart } from './generation/ball-distribution-chart-generator';
import {
  generateLeaveCategoryFrequencyChart as createLeaveCategoryFrequencyChart,
  generateLeaveCategoryPickupChart as createLeaveCategoryPickupChart,
  generateTopCommonLeavesChart as createTopCommonLeavesChart,
  generateTopWorstLeavesChart as createTopWorstLeavesChart,
  generateLeaveScatterChart as createLeaveScatterChart,
  generateLeaveParetoChart as createLeaveParetoChart,
  generatePracticePriorityChart as createPracticePriorityChart,
} from './generation/leave-chart-generator';

@Injectable({
  providedIn: 'root',
})
export class ChartGenerationService {
  /**
   * Generate score chart showing average over time and difference from average
   */
  generateScoreChart(
    scoreChart: ElementRef,
    games: Game[],
    existingChartInstance: Chart | undefined,
    viewMode?: 'week' | 'game' | 'monthly' | 'yearly',
    onToggleView?: () => void,
    isReload?: boolean,
  ): Chart {
    return generateScoreChart(scoreChart, games, existingChartInstance, viewMode, onToggleView, isReload);
  }

  /**
   * Generate score distribution chart showing frequency of scores in ranges
   */
  generateScoreDistributionChart(
    scoreDistributionChart: ElementRef,
    games: Game[],
    existingChartInstance: Chart | undefined,
    isReload?: boolean,
  ): Chart {
    return generateScoreDistributionChart(scoreDistributionChart, games, existingChartInstance, isReload);
  }

  /**
   * Generate average score chart showing average scores over time
   */
  generateAverageScoreChart(
    scoreChart: ElementRef,
    games: Game[],
    existingChartInstance: Chart | undefined,
    viewMode?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    onToggleView?: () => void,
    isReload?: boolean,
  ): Chart {
    return generateAverageScoreChart(scoreChart, games, existingChartInstance, viewMode, onToggleView, isReload);
  }

  /**
   * Generate pin chart (radar) showing spare conversion rates
   */
  generatePinChart(pinChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
    return generatePinChart(pinChart, stats, existingChartInstance, isReload);
  }

  /**
   * Generate spare distribution chart showing appearance and hit counts per pin
   */
  generateSpareDistributionChart(
    spareDistributionChart: ElementRef,
    stats: Stats,
    existingChartInstance: Chart | undefined,
    isReload?: boolean,
  ): Chart {
    return generateSpareDistributionChart(spareDistributionChart, stats, existingChartInstance, isReload);
  }

  /**
   * Generate throw chart (radar) showing strike, spare, and open percentages
   */
  generateThrowChart(throwChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
    return generateThrowChart(throwChart, stats, existingChartInstance, isReload);
  }

  /**
   * Generate ball distribution chart showing RG vs Diff scatter plot with ball images
   */
  generateBallDistributionChart(
    ballDistributionChartCanvas: ElementRef,
    balls: Ball[],
    existingChartInstance: Chart | undefined,
    isReload?: boolean,
  ): Chart {
    return generateBallDistributionChart(ballDistributionChartCanvas, balls, existingChartInstance, isReload);
  }

  /**
   * Generate leave category frequency chart
   * Shows how often each type of leave (single pin, split, etc.) occurs
   */
  generateLeaveCategoryFrequencyChart(
    chartRef: ElementRef,
    leaves: LeaveStats[],
    existingChartInstance: Chart | undefined,
    isReload?: boolean,
  ): Chart {
    return createLeaveCategoryFrequencyChart(chartRef, leaves, existingChartInstance, isReload);
  }

  /**
   * Generate leave category pickup percentage chart
   * Shows conversion rate by leave category (single pin, split, etc.)
   */
  generateLeaveCategoryPickupChart(chartRef: ElementRef, leaves: LeaveStats[], existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
    return createLeaveCategoryPickupChart(chartRef, leaves, existingChartInstance, isReload);
  }

  /**
   * Generate top N most common leaves chart
   * Horizontal bar chart showing the most frequently occurring leaves
   */
  generateTopCommonLeavesChart(
    chartRef: ElementRef,
    leaves: LeaveStats[],
    existingChartInstance: Chart | undefined,
    topN = 10,
    isReload?: boolean,
  ): Chart {
    return createTopCommonLeavesChart(chartRef, leaves, existingChartInstance, topN, isReload);
  }

  /**
   * Generate top N worst pickup percentage chart
   * Shows the hardest leaves to convert
   */
  generateTopWorstLeavesChart(
    chartRef: ElementRef,
    leaves: LeaveStats[],
    existingChartInstance: Chart | undefined,
    topN = 10,
    isReload?: boolean,
  ): Chart {
    return createTopWorstLeavesChart(chartRef, leaves, existingChartInstance, topN, isReload);
  }

  /**
   * Generate leave scatter chart
   * Shows all leaves plotted by frequency vs pickup percentage
   * Highlights outliers (most common, best, worst)
   */
  generateLeaveScatterChart(chartRef: ElementRef, leaves: LeaveStats[], existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
    return createLeaveScatterChart(chartRef, leaves, existingChartInstance, isReload);
  }

  /**
   * Generate Pareto chart for leaves
   * Shows which leaves cause the most misses (cumulative analysis)
   * Helps identify practice priorities
   */
  generateLeaveParetoChart(
    chartRef: ElementRef,
    leaves: LeaveStats[],
    existingChartInstance: Chart | undefined,
    topN = 15,
    isReload?: boolean,
  ): Chart {
    return createLeaveParetoChart(chartRef, leaves, existingChartInstance, topN, isReload);
  }

  /**
   * Generate practice priority chart
   * Shows leaves with high frequency AND low pickup rate
   * Best targets for practice improvement
   */
  generatePracticePriorityChart(
    chartRef: ElementRef,
    leaves: LeaveStats[],
    existingChartInstance: Chart | undefined,
    topN = 10,
    isReload?: boolean,
  ): Chart {
    return createPracticePriorityChart(chartRef, leaves, existingChartInstance, topN, isReload);
  }
}
