import { Injectable } from '@angular/core';
import { PatternRecommendation, RecommendationCriteria } from '../../models/pattern-recommendation.model';

@Injectable({
  providedIn: 'root',
})
export class PatternRecommendationService {

  generateRecommendations(criteria: RecommendationCriteria): PatternRecommendation {
    const ballSelection = this.getBallSelectionRecommendation(criteria);
    const specificBallRecommendations = this.getSpecificBallRecommendations(criteria);
    const targetingStrategy = this.getTargetingStrategy(criteria);
    const arrowTargeting = this.getArrowTargeting(criteria);
    const breakpointStrategy = this.getBreakpointStrategy(criteria);
    const speedAdjustment = this.getSpeedAdjustment(criteria);
    const generalTips = this.getGeneralTips(criteria);

    return {
      ballSelection,
      specificBallRecommendations,
      targetingStrategy,
      arrowTargeting,
      breakpointStrategy,
      speedAdjustment,
      generalTips,
    };
  }

  private getBallSelectionRecommendation(criteria: RecommendationCriteria): string {
    const { volume, difficulty, length } = criteria;

    if (volume === 'Very High' || volume === 'High') {
      if (difficulty === 'Hard') {
        return 'Use a ball with strong coverstock (solid reactive) to handle heavy oil and create more friction.';
      } else {
        return 'Medium to strong coverstock ball with controlled reaction for heavy oil conditions.';
      }
    } else if (volume === 'Medium') {
      if (length === 'Long') {
        return 'Medium strength ball with predictable backend reaction for medium oil, long patterns.';
      } else {
        return 'Versatile ball with medium coverstock that can handle various line adjustments.';
      }
    } else {
      // Light volume
      if (difficulty === 'Hard') {
        return 'Weaker coverstock or urethane ball to avoid over-reaction on light oil conditions.';
      } else {
        return 'Light oil ball with controlled backend or urethane for predictable motion.';
      }
    }
  }

  private getSpecificBallRecommendations(criteria: RecommendationCriteria): string[] {
    const { volume, difficulty, length } = criteria;
    const recommendations: string[] = [];

    if (volume === 'Very High' || volume === 'High') {
      if (difficulty === 'Hard') {
        recommendations.push('Storm Phaze II (2018) - Proven strong solid reactive for heavy oil patterns');
        recommendations.push('Motiv Jackal Ghost (2021) - Modern aggressive asymmetric with strong backend');
        recommendations.push('Brunswick Kingpin Max (2020) - Strong continuous motion through heavy oil');
        recommendations.push('Arsenal Note: Pair with a medium-strength ball and urethane for complete coverage');
      } else {
        recommendations.push('Storm IQ Tour Emerald (2023) - Latest benchmark ball technology for heavy oil');
        recommendations.push('Hammer Black Widow 2.0 (2019) - Reliable heavy oil option with proven track record');
        recommendations.push('Columbia 300 Eruption Pro (2017) - Older but effective heavy oil ball');
        recommendations.push('Arsenal Note: Add a pearl reactive for transitioning lanes and a spare ball');
      }
    } else if (volume === 'Medium') {
      if (length === 'Long') {
        recommendations.push('Storm IQ Tour (2020) - Modern benchmark ball for medium-long patterns');
        recommendations.push('Roto Grip Hustle Ink (2019) - Versatile medium oil workhorse');
        recommendations.push('DV8 Misfit (2023) - New release with controlled backend reaction');
        recommendations.push('Arsenal Note: Complement with solid reactive for heavier oil and urethane for tight conditions');
      } else {
        recommendations.push('Hammer Raw Hammer (2022) - Recent versatile medium oil release');
        recommendations.push('Brunswick Rhino (2018) - Proven medium oil performance');
        recommendations.push('Storm Tropical Surge (2021) - Smooth reaction for medium-short patterns');
        recommendations.push('Arsenal Note: Build around this with stronger and weaker options for lane transition');
      }
    } else {
      // Light volume
      if (difficulty === 'Hard') {
        recommendations.push('Storm Mix (2022) - Modern urethane for controlled light oil play');
        recommendations.push('Hammer Purple Pearl Urethane (2020) - Predictable motion on challenging conditions');
        recommendations.push('Brunswick T-Zone (Classic) - Reliable polyester for straight shots');
        recommendations.push('Arsenal Note: Essential to have alongside reactive balls for versatility');
      } else {
        recommendations.push('Storm Tropical Breeze (2021) - Recent light oil reactive technology');
        recommendations.push('Motiv Freestyle Rush (2023) - New pearl reactive for light conditions');
        recommendations.push('Columbia 300 Scout Reactive (2022) - Entry-level reactive with modern coverstock');
        recommendations.push('Arsenal Note: Perfect starter balls that work well with heavier oil options');
      }
    }

    return recommendations;
  }

  private getTargetingStrategy(criteria: RecommendationCriteria): string {
    const { length, difficulty, volume } = criteria;

    if (length === 'Short') {
      if (volume === 'Very High' || volume === 'High') {
        return 'Play more direct lines and avoid extreme angles. Focus on accuracy over power. Short heavy oil patterns require precision and controlled entry angle.';
      } else {
        return 'Short patterns allow for steeper angles and more room for error. You can play more aggressively with higher rev rates and create sharper entry angles.';
      }
    } else if (length === 'Medium') {
      return 'Medium patterns offer balanced play options. You can play both direct and angled shots effectively. Start with a moderate approach and adjust based on carry and pin action.';
    } else {
      // Long patterns
      if (difficulty === 'Hard') {
        return 'Long difficult patterns require extreme precision and patience. Play conservative lines with minimal side rotation. Focus on hitting your target consistently.';
      } else {
        return 'Long patterns provide room for adjustment and recovery. You can open up your angles as the pattern transitions and creates more friction downlane.';
      }
    }
  }

  private getArrowTargeting(criteria: RecommendationCriteria): string {
    const { length, difficulty, volume } = criteria;

    // Right-handed targeting recommendations
    if (length === 'Short') {
      if (volume === 'Light') {
        return 'Right-handed: Target 1st-2nd arrow (boards 5-10), stand right of center. Left-handed: Target 3rd-4th arrow (boards 15-20), stand left of center.';
      } else if (volume === 'Medium') {
        return 'Right-handed: Target 2nd arrow (board 10), move feet right as needed. Left-handed: Target 3rd arrow (board 15), move feet left as needed.';
      } else {
        return 'Right-handed: Target 2nd-3rd arrow (boards 10-15), play more direct. Left-handed: Target 2nd-3rd arrow (boards 10-15), play more direct.';
      }
    } else if (length === 'Medium') {
      if (difficulty === 'Hard') {
        return 'Right-handed: Target 2nd arrow (board 10) with minimal axis rotation. Left-handed: Target 3rd arrow (board 15) with minimal axis rotation.';
      } else {
        return 'Right-handed: Start at 2nd arrow (board 10), can move to 3rd arrow (board 15) as pattern breaks down. Left-handed: Start at 3rd arrow (board 15), can move to 2nd arrow (board 10).';
      }
    } else {
      // Long patterns
      if (difficulty === 'Hard') {
        return 'Right-handed: Target 2nd arrow (board 10) and stay there - consistency is key. Left-handed: Target 3rd arrow (board 15) and maintain that line.';
      } else {
        return 'Right-handed: Start at 2nd arrow (board 10), can eventually move to 3rd-4th arrow (boards 15-20). Left-handed: Start at 3rd arrow (board 15), can move to 1st-2nd arrow (boards 5-10).';
      }
    }
  }

  private getBreakpointStrategy(criteria: RecommendationCriteria): string {
    const { length, difficulty, volume } = criteria;

    if (length === 'Short') {
      if (volume === 'High' || volume === 'Very High') {
        return 'Target breakpoint at board 8-12. Heavy oil on short patterns requires the ball to start its move earlier. Focus on creating consistent entry angle at this breakpoint.';
      } else {
        return 'Target breakpoint at board 5-8. Short patterns with lighter oil allow for sharper breakpoints closer to the channel. This creates more backend motion to the pocket.';
      }
    } else if (length === 'Medium') {
      if (difficulty === 'Hard') {
        return 'Target breakpoint at board 10-12. Medium sport patterns require precise breakpoint control. Maintain consistency at this board range for optimal pocket entry.';
      } else {
        return 'Target breakpoint at board 8-12. You have some flexibility with breakpoint location. Adjust based on ball reaction and pin carry.';
      }
    } else {
      // Long patterns
      if (volume === 'High' || volume === 'Very High') {
        return 'Target breakpoint at board 12-15. Long heavy patterns require patience - aim for a controlled breakpoint further from the channel to maintain energy through the pins.';
      } else {
        return 'Target breakpoint at board 10-13. Long patterns give you room to work with, but maintain a consistent breakpoint to avoid erratic ball motion.';
      }
    }
  }

  private getSpeedAdjustment(criteria: RecommendationCriteria): string {
    const { volume, length, difficulty } = criteria;

    if (volume === 'Very High' || volume === 'High') {
      return 'Consider increasing ball speed slightly to get through the heavy oil and create more backend reaction.';
    } else if (volume === 'Light') {
      return 'Reduce ball speed to allow more time for the ball to react to the lighter oil condition.';
    } else {
      if (length === 'Long' && difficulty === 'Hard') {
        return 'Maintain consistent, controlled speed. Avoid speed changes that can affect accuracy.';
      } else {
        return 'Use your normal speed with minor adjustments based on ball reaction.';
      }
    }
  }

  private getGeneralTips(criteria: RecommendationCriteria): string[] {
    const tips: string[] = [];
    const { difficulty, length, volume, category } = criteria;

    // Difficulty-based tips
    if (difficulty === 'Hard') {
      tips.push('Focus on consistency over power - precision is key on difficult patterns');
      tips.push('Make smaller, incremental adjustments rather than large moves');
    } else if (difficulty === 'Easy') {
      tips.push('Take advantage of the forgiving nature - you can be more aggressive with angles');
    }

    // Length-based tips
    if (length === 'Short') {
      tips.push('Shorter patterns create more backend reaction - control your rev rate');
    } else if (length === 'Long') {
      tips.push('Longer patterns require patience - the ball needs more time to react');
    }

    // Volume-based tips  
    if (volume === 'Very High') {
      tips.push('Heavy oil requires surface adjustments - consider changing ball surface if needed');
    } else if (volume === 'Light') {
      tips.push('Light oil can cause over-reaction - focus on smooth, controlled releases');
    }

    // Category-specific tips
    if (category.toLowerCase().includes('sport') || category.toLowerCase().includes('pba')) {
      tips.push('Tournament patterns require mental toughness and strategic thinking');
    }

    // General tips
    tips.push('Watch other bowlers and learn from their line adjustments');
    tips.push('Stay patient and make one adjustment at a time');

    return tips;
  }
}