import { ElementRef } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { Stats } from 'src/app/core/models/stats.model';
import { Ball } from '../../models/ball.model';
import { Chart } from 'chart.js';

import {
  generateScoreChart as _generateScoreChart,
  generateScoreDistributionChart as _generateScoreDistributionChart,
  generateAverageScoreChart as _generateAverageScoreChart,
} from './generation/score-chart-generator';
import {
  generatePinChart as _generatePinChart,
  generateSpareDistributionChart as _generateSpareDistributionChart,
} from './generation/pin-spare-chart-generator';
import { generateThrowChart as _generateThrowChart } from './generation/throw-chart-generator';
import { generateBallDistributionChart as _generateBallDistributionChart } from './generation/ball-distribution-chart-generator';

/**
 * Generate score chart showing average over time and difference from average
 */
export function generateScoreChart(
  scoreChart: ElementRef,
  games: Game[],
  existingChartInstance: Chart | undefined,
  viewMode?: 'week' | 'game' | 'session' | 'monthly' | 'yearly',
  onToggleView?: () => void,
  isReload?: boolean,
): Chart {
  return _generateScoreChart(scoreChart, games, existingChartInstance, viewMode, onToggleView, isReload);
}

/**
 * Generate score distribution chart showing frequency of scores in ranges
 */
export function generateScoreDistributionChart(
  scoreDistributionChart: ElementRef,
  games: Game[],
  existingChartInstance: Chart | undefined,
  isReload?: boolean,
): Chart {
  return _generateScoreDistributionChart(scoreDistributionChart, games, existingChartInstance, isReload);
}

/**
 * Generate average score chart showing average scores over time
 */
export function generateAverageScoreChart(
  scoreChart: ElementRef,
  games: Game[],
  existingChartInstance: Chart | undefined,
  viewMode?: 'session' | 'weekly' | 'monthly' | 'yearly',
  onToggleView?: () => void,
  isReload?: boolean,
): Chart {
  return _generateAverageScoreChart(scoreChart, games, existingChartInstance, viewMode, onToggleView, isReload);
}

/**
 * Generate pin chart (radar) showing spare conversion rates
 */
export function generatePinChart(pinChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
  return _generatePinChart(pinChart, stats, existingChartInstance, isReload);
}

/**
 * Generate spare distribution chart showing appearance and hit counts per pin
 */
export function generateSpareDistributionChart(
  spareDistributionChart: ElementRef,
  stats: Stats,
  existingChartInstance: Chart | undefined,
  isReload?: boolean,
): Chart {
  return _generateSpareDistributionChart(spareDistributionChart, stats, existingChartInstance, isReload);
}

/**
 * Generate throw chart (radar) showing strike, spare, and open percentages
 */
export function generateThrowChart(throwChart: ElementRef, stats: Stats, existingChartInstance: Chart | undefined, isReload?: boolean): Chart {
  return _generateThrowChart(throwChart, stats, existingChartInstance, isReload);
}

/**
 * Generate ball distribution chart showing RG vs Diff scatter plot with ball images
 */
export function generateBallDistributionChart(
  ballDistributionChartCanvas: ElementRef,
  balls: Ball[],
  existingChartInstance: Chart | undefined,
  isReload?: boolean,
): Chart {
  return _generateBallDistributionChart(ballDistributionChartCanvas, balls, existingChartInstance, isReload);
}
