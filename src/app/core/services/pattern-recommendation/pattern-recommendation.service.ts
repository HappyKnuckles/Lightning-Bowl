import { Injectable } from '@angular/core';
import { PatternRecommendation, RecommendationCriteria } from '../../models/pattern-recommendation.model';
import { Ball } from '../../models/ball.model';

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
    const { volume, difficulty, length, arsenal } = criteria;
    const recommendations: string[] = [];

    if (volume === 'Very High' || volume === 'High') {
      if (difficulty === 'Hard') {
        const recommendedBalls = [
          { name: 'Storm Phaze II', year: '2018', description: 'Proven strong solid reactive for heavy oil patterns' },
          { name: 'Motiv Jackal Ghost', year: '2021', description: 'Modern aggressive asymmetric with strong backend' },
          { name: 'Brunswick Kingpin Max', year: '2020', description: 'Strong continuous motion through heavy oil' }
        ];
        
        this.addBallRecommendationsWithArsenalCheck(recommendations, recommendedBalls, arsenal, 'heavy oil', 'solid reactive');
        recommendations.push('Arsenal Note: Pair with a medium-strength ball and urethane for complete coverage');
      } else {
        const recommendedBalls = [
          { name: 'Storm IQ Tour Emerald', year: '2023', description: 'Latest benchmark ball technology for heavy oil' },
          { name: 'Hammer Black Widow 2.0', year: '2019', description: 'Reliable heavy oil option with proven track record' },
          { name: 'Columbia 300 Eruption Pro', year: '2017', description: 'Older but effective heavy oil ball' }
        ];
        
        this.addBallRecommendationsWithArsenalCheck(recommendations, recommendedBalls, arsenal, 'heavy oil', 'strong reactive');
        recommendations.push('Arsenal Note: Add a pearl reactive for transitioning lanes and a spare ball');
      }
    } else if (volume === 'Medium') {
      if (length === 'Long') {
        const recommendedBalls = [
          { name: 'Storm IQ Tour', year: '2020', description: 'Modern benchmark ball for medium-long patterns' },
          { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Versatile medium oil workhorse' },
          { name: 'DV8 Misfit', year: '2023', description: 'New release with controlled backend reaction' }
        ];
        
        this.addBallRecommendationsWithArsenalCheck(recommendations, recommendedBalls, arsenal, 'medium oil', 'benchmark');
        recommendations.push('Arsenal Note: Complement with solid reactive for heavier oil and urethane for tight conditions');
      } else {
        const recommendedBalls = [
          { name: 'Hammer Raw Hammer', year: '2022', description: 'Recent versatile medium oil release' },
          { name: 'Brunswick Rhino', year: '2018', description: 'Proven medium oil performance' },
          { name: 'Storm Tropical Surge', year: '2021', description: 'Smooth reaction for medium-short patterns' }
        ];
        
        this.addBallRecommendationsWithArsenalCheck(recommendations, recommendedBalls, arsenal, 'medium oil', 'versatile');
        recommendations.push('Arsenal Note: Build around this with stronger and weaker options for lane transition');
      }
    } else {
      // Light volume
      if (difficulty === 'Hard') {
        const recommendedBalls = [
          { name: 'Storm Mix', year: '2022', description: 'Modern urethane for controlled light oil play' },
          { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable motion on challenging conditions' },
          { name: 'Brunswick T-Zone', year: 'Classic', description: 'Reliable polyester for straight shots' }
        ];
        
        this.addBallRecommendationsWithArsenalCheck(recommendations, recommendedBalls, arsenal, 'light oil', 'urethane');
        recommendations.push('Arsenal Note: Essential to have alongside reactive balls for versatility');
      } else {
        const recommendedBalls = [
          { name: 'Storm Tropical Breeze', year: '2021', description: 'Recent light oil reactive technology' },
          { name: 'Motiv Freestyle Rush', year: '2023', description: 'New pearl reactive for light conditions' },
          { name: 'Columbia 300 Scout Reactive', year: '2022', description: 'Entry-level reactive with modern coverstock' }
        ];
        
        this.addBallRecommendationsWithArsenalCheck(recommendations, recommendedBalls, arsenal, 'light oil', 'pearl reactive');
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

  private addBallRecommendationsWithArsenalCheck(
    recommendations: string[], 
    recommendedBalls: {name: string, year: string, description: string}[], 
    arsenal: Ball[] | undefined,
    patternType: string,
    ballCategory: string
  ): void {
    recommendedBalls.forEach(ball => {
      let recommendation = `${ball.name} (${ball.year}) - ${ball.description}`;
      
      if (arsenal && arsenal.length > 0) {
        const arsenalMatch = this.findSimilarBallInArsenal(ball.name, arsenal, ballCategory);
        if (arsenalMatch) {
          recommendation += ` | ✅ Consider your ${arsenalMatch.ball_name} - similar performance for ${patternType}`;
        }
      }
      
      recommendations.push(recommendation);
    });
  }

  private findSimilarBallInArsenal(recommendedBallName: string, arsenal: Ball[], category: string): Ball | null {
    // First, try exact name match (case insensitive)
    let match = arsenal.find(ball => 
      ball.ball_name.toLowerCase().includes(recommendedBallName.toLowerCase()) ||
      recommendedBallName.toLowerCase().includes(ball.ball_name.toLowerCase())
    );
    
    if (match) return match;

    // Then try to match by characteristics based on category
    if (category.includes('solid reactive') || category.includes('heavy oil')) {
      match = arsenal.find(ball => 
        ball.coverstock_type?.toLowerCase().includes('solid') ||
        ball.ball_name.toLowerCase().includes('phaze') ||
        ball.ball_name.toLowerCase().includes('jackal') ||
        ball.ball_name.toLowerCase().includes('kingpin')
      );
    } else if (category.includes('benchmark')) {
      match = arsenal.find(ball =>
        ball.ball_name.toLowerCase().includes('iq tour') ||
        ball.ball_name.toLowerCase().includes('hustle') ||
        ball.ball_name.toLowerCase().includes('rhino') ||
        ball.coverstock_type?.toLowerCase().includes('hybrid')
      );
    } else if (category.includes('urethane') || category.includes('light oil')) {
      match = arsenal.find(ball =>
        ball.coverstock_type?.toLowerCase().includes('urethane') ||
        ball.coverstock_type?.toLowerCase().includes('polyester') ||
        ball.ball_name.toLowerCase().includes('mix') ||
        ball.ball_name.toLowerCase().includes('purple pearl')
      );
    } else if (category.includes('pearl reactive')) {
      match = arsenal.find(ball =>
        ball.coverstock_type?.toLowerCase().includes('pearl') ||
        ball.ball_name.toLowerCase().includes('tropical') ||
        ball.ball_name.toLowerCase().includes('freestyle')
      );
    }

    return match || null;
  }
}