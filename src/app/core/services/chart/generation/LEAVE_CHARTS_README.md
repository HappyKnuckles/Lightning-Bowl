# Leave Chart Generators

Comprehensive chart generation system for analyzing bowling leave statistics with multiple visualization strategies.

## Overview

When dealing with 40+ different leave patterns, standard charts become unreadable. This system implements best practices for large, sparse, highly-variable leave data through:

1. **Grouping** - Categories instead of individual leaves
2. **Top-N filtering** - Focus on most significant leaves
3. **Smart labeling** - Highlight only outliers
4. **Priority scoring** - Identify practice targets
5. **Pareto analysis** - Show cumulative impact

## Chart Types

### 1. Category Frequency Chart

**Function**: `generateLeaveCategoryFrequencyChart()`

Shows occurrence count by leave category.

**Categories**:

- Single Pin (7, 10, 6, 3, etc.)
- Baby Split (2-7, 3-10, 4-10, 6-7)
- Big Split (7-10, 4-6, 4-6-7, etc.)
- Bucket/Cluster (4+ pins)
- Washout (1-2-10, 1-3-7, etc.)
- Miscellaneous

**Use Case**: Understand which types of leaves you face most often.

**Example**:

```typescript
const chart = chartService.generateLeaveCategoryFrequencyChart(chartRef, allLeaves, existingChart);
```

---

### 2. Category Pickup Percentage Chart

**Function**: `generateLeaveCategoryPickupChart()`

Shows conversion rate by leave category.

**Features**:

- Percentage bar chart
- Shows pickup success rate (0-100%)
- Identifies category strengths/weaknesses

**Use Case**: See which types of leaves you convert best/worst.

---

### 3. Top Common Leaves Chart

**Function**: `generateTopCommonLeavesChart()`

Horizontal bar chart showing most frequently occurring leaves.

**Parameters**:

- `topN` - Number of leaves to show (default: 10)

**Features**:

- Sorted by occurrence frequency
- Shows pickup rate in tooltip
- Pin notation format (e.g., "7-10", "3-6-10")

**Use Case**: Focus on the leaves you encounter most.

---

### 4. Top Worst Leaves Chart

**Function**: `generateTopWorstLeavesChart()`

Shows leaves with lowest pickup percentage.

**Parameters**:

- `topN` - Number of leaves to show (default: 10)

**Filtering**:

- Only includes leaves with ≥2 occurrences (statistical significance)

**Features**:

- Sorted by pickup percentage (ascending)
- Shows miss count
- Identifies hardest conversions

**Use Case**: Identify which leaves give you the most trouble.

---

### 5. Leave Scatter Chart

**Function**: `generateLeaveScatterChart()`

Plots all leaves: frequency (x) vs pickup percentage (y).

**Smart Labeling**:
Only labels outliers:

- Top 5 most common
- Worst 5 pickup %
- Best 5 pickup %

**Features**:

- All leaves visible without clutter
- Larger points for important leaves
- Interactive tooltips for all data

**Use Case**: Complete overview while maintaining readability.

---

### 6. Pareto Chart

**Function**: `generateLeaveParetoChart()`

Shows which leaves cause the most misses (80/20 analysis).

**Parameters**:

- `topN` - Number of leaves to analyze (default: 15)

**Components**:

- **Bars**: Missed attempts per leave
- **Line**: Cumulative percentage

**Insight**: "80% of your misses come from these N leaves"

**Use Case**: Identify where practice has the biggest impact.

---

### 7. Practice Priority Chart

**Function**: `generatePracticePriorityChart()`

Shows leaves with **high frequency AND low conversion** = best practice targets.

**Priority Score**: `occurrences × (100 - pickupPercentage)`

**Parameters**:

- `topN` - Number of priorities to show (default: 10)

**Filtering**:

- Minimum 3 occurrences (focus on patterns, not noise)

**Use Case**: Optimize practice time by targeting high-impact leaves.

---

## Data Structure

### LeaveStats Interface

```typescript
interface LeaveStats {
  pins: number[]; // Pin positions left standing
  occurrences: number; // How many times this leave appeared
  pickups: number; // How many times it was converted
  pickupPercentage: number; // Success rate (0-100)
}
```

### Leave Categories

```typescript
enum LeaveCategory {
  SinglePin = "Single Pin",
  BabySplit = "Baby Split",
  BigSplit = "Big Split",
  Bucket = "Bucket/Cluster",
  Washout = "Washout",
  Miscellaneous = "Miscellaneous",
}
```

---

## Usage Examples

### Basic Integration

```typescript
import { ChartGenerationService } from "src/app/core/services/chart/chart-generation.service";
import { LeaveStats } from "src/app/core/models/stats.model";

export class LeaveStatsComponent {
  private chartService = inject(ChartGenerationService);

  @ViewChild("categoryChart") categoryChartRef!: ElementRef;
  @ViewChild("paretoChart") paretoChartRef!: ElementRef;

  private categoryChart?: Chart;
  private paretoChart?: Chart;

  displayLeaveStats(leaves: LeaveStats[]): void {
    // Show category breakdown
    this.categoryChart = this.chartService.generateLeaveCategoryFrequencyChart(this.categoryChartRef, leaves, this.categoryChart, true);

    // Show practice priorities
    this.paretoChart = this.chartService.generateLeaveParetoChart(this.paretoChartRef, leaves, this.paretoChart, true);
  }
}
```

### Dashboard Layout

```html
<ion-grid>
  <ion-row>
    <!-- Category Overview -->
    <ion-col size="12" sizeMd="6">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Leave Categories</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <canvas #categoryChart></canvas>
        </ion-card-content>
      </ion-card>
    </ion-col>

    <!-- Practice Priorities -->
    <ion-col size="12" sizeMd="6">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Practice Priorities</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <canvas #paretoChart></canvas>
        </ion-card-content>
      </ion-card>
    </ion-col>
  </ion-row>

  <ion-row>
    <!-- Most Common -->
    <ion-col size="12" sizeMd="6">
      <canvas #commonChart></canvas>
    </ion-col>

    <!-- Hardest Leaves -->
    <ion-col size="12" sizeMd="6">
      <canvas #worstChart></canvas>
    </ion-col>
  </ion-row>

  <ion-row>
    <!-- Scatter Overview -->
    <ion-col size="12">
      <canvas #scatterChart></canvas>
    </ion-col>
  </ion-row>
</ion-grid>
```

---

## Utility Functions

### `categorizeLeave(pins: number[]): LeaveCategory`

Assigns a leave to its category based on pin pattern.

### `groupLeavesByCategory(leaves: LeaveStats[]): CategorizedLeave[]`

Groups all leaves by category with aggregate stats.

### `formatPinLeave(pins: number[]): string`

Formats pin array as bowling notation (e.g., `[7, 10]` → `"7-10"`).

---

## Design Principles

1. **No massive single charts** - 40+ items = unreadable
2. **Group when possible** - 6 categories vs 40 leaves
3. **Filter for significance** - Min occurrence thresholds
4. **Highlight outliers only** - Smart labeling
5. **Actionable insights** - Practice priorities, not just data
6. **Progressive disclosure** - Summary first, drill down optional

---

## Performance Notes

- All charts handle 100+ leaves efficiently
- Category grouping reduces visual complexity
- Top-N filtering keeps chart sizes manageable
- Scatter plots auto-filter labels to prevent overlap

---

## Future Enhancements

### Potential Additions:

1. **Trend Analysis** - Leave stats over time
2. **Lane Pattern Correlation** - Leaves vs oil patterns
3. **Ball Comparison** - Leave differences by ball
4. **Session Comparison** - Before/after practice
5. **Drill-Down UI** - Category → Individual leaves
6. **Export Reports** - PDF summaries with charts

### Interactive Features:

- Click category to see individual leaves
- Filter by date range
- Compare multiple bowlers
- Set custom practice goals

---

## Related Files

- `src/app/core/models/stats.model.ts` - LeaveStats interface
- `src/app/core/services/game-stats/game-stats-calculator/pin-stats-calculator.service.ts` - Leave calculation
- `src/app/core/services/game-stats/game-stats.service.ts` - Leave data access
- `src/app/core/services/chart/chart-generation.service.ts` - Facade service
- `src/app/core/services/chart/generation/leave-chart-generator.ts` - Implementation

---

## Testing

### Manual Testing Checklist:

- [ ] All 7 chart types render without errors
- [ ] Category grouping works correctly
- [ ] Top-N filtering shows correct leaves
- [ ] Scatter plot labels only outliers
- [ ] Pareto cumulative line reaches 100%
- [ ] Priority scores rank correctly
- [ ] Tooltips show all relevant data
- [ ] Charts handle empty/minimal data gracefully
- [ ] Responsive on mobile devices
- [ ] Chart destroy/reload works properly

### Test Data Scenarios:

1. **Empty**: No leaves → graceful handling
2. **Minimal**: 1-5 leaves → all visible
3. **Moderate**: 10-20 leaves → good readability
4. **Large**: 40+ leaves → grouping essential
5. **Extreme**: 100+ leaves → performance test

---

**Last Updated**: December 2025  
**Author**: Lightning Bowl Development Team  
**Version**: 1.0.0
