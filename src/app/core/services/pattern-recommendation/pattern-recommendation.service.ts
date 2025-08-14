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
    
    // Build a 3-ball arsenal strategy
    return this.buildThreeBallArsenalStrategy(criteria);
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

  private buildThreeBallArsenalStrategy(criteria: RecommendationCriteria): string[] {
    const { volume, difficulty, length, arsenal } = criteria;
    const recommendations: string[] = [];
    const usedArsenalBalls = new Set<string>();

    // Define the three ball categories needed
    const ballCategories = this.getRequiredBallCategories(criteria);
    
    ballCategories.forEach(category => {
      const { categoryName, ballOptions, purpose } = category;
      
      // Check if user has a suitable ball in their arsenal for this category
      let arsenalMatch: Ball | null = null;
      if (arsenal && arsenal.length > 0) {
        arsenalMatch = this.findBestArsenalMatch(ballOptions, arsenal, categoryName, usedArsenalBalls);
      }

      if (arsenalMatch) {
        // User has a suitable ball - recommend it first
        usedArsenalBalls.add(arsenalMatch.ball_name);
        recommendations.push(`${arsenalMatch.ball_name} - ${purpose}`);
        
        // Add an alternative suggestion
        const alternativeBall = ballOptions[0]; // Use the first recommended ball as alternative
        recommendations.push(`Alternative: ${alternativeBall.name} (${alternativeBall.year}) - ${alternativeBall.description}`);
      } else {
        // User doesn't have a suitable ball - recommend the best option
        const recommendedBall = ballOptions[0];
        recommendations.push(`${recommendedBall.name} (${recommendedBall.year}) - ${recommendedBall.description}`);
      }
    });

    // Add arsenal note
    recommendations.push(`Arsenal Note: These three balls provide complete coverage for lane transition - start with the heavy oil ball and move to lighter options as the pattern breaks down`);

    return recommendations;
  }

  private getRequiredBallCategories(criteria: RecommendationCriteria) {
    const { volume, difficulty, length } = criteria;
    
    // Always recommend a 3-ball strategy: Heavy Oil, Benchmark/Medium, Light Oil
    const categories = [];

    // Heavy oil ball
    if (volume === 'Very High' || volume === 'High') {
      categories.push({
        categoryName: 'solid reactive',
        purpose: 'good for early games and heavy oil conditions',
        ballOptions: [
          { name: 'Storm Phaze II', year: '2018', description: 'Proven strong solid reactive for heavy oil patterns' },
          { name: 'Motiv Jackal Ghost', year: '2021', description: 'Modern aggressive asymmetric with strong backend' },
          { name: 'Brunswick Kingpin Max', year: '2020', description: 'Strong continuous motion through heavy oil' }
        ]
      });
    } else {
      categories.push({
        categoryName: 'strong reactive',
        purpose: 'good for early games and heavier oil sections',
        ballOptions: [
          { name: 'Storm IQ Tour Emerald', year: '2023', description: 'Latest benchmark ball technology' },
          { name: 'Hammer Black Widow 2.0', year: '2019', description: 'Reliable strong option with proven track record' },
          { name: 'Columbia 300 Eruption Pro', year: '2017', description: 'Effective strong reactive ball' }
        ]
      });
    }

    // Benchmark/Transition ball
    categories.push({
      categoryName: 'benchmark',
      purpose: 'good for transitions and medium oil conditions',
      ballOptions: [
        { name: 'Storm IQ Tour', year: '2020', description: 'Modern benchmark ball for medium patterns' },
        { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Versatile medium oil workhorse' },
        { name: 'DV8 Misfit', year: '2023', description: 'New release with controlled backend reaction' }
      ]
    });

    // Light oil/Control ball
    if (difficulty === 'Hard' || volume === 'Light') {
      categories.push({
        categoryName: 'urethane',
        purpose: 'good for control and challenging conditions',
        ballOptions: [
          { name: 'Storm Mix', year: '2022', description: 'Modern urethane for controlled play' },
          { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable motion on challenging conditions' },
          { name: 'Brunswick T-Zone', year: 'Classic', description: 'Reliable polyester for straight shots' }
        ]
      });
    } else {
      categories.push({
        categoryName: 'pearl reactive',
        purpose: 'good for late games and light oil conditions',
        ballOptions: [
          { name: 'Storm Tropical Breeze', year: '2021', description: 'Recent light oil reactive technology' },
          { name: 'Motiv Freestyle Rush', year: '2023', description: 'New pearl reactive for light conditions' },
          { name: 'Columbia 300 Scout Reactive', year: '2022', description: 'Entry-level reactive with modern coverstock' }
        ]
      });
    }

    return categories;
  }

  private findBestArsenalMatch(
    ballOptions: {name: string, year: string, description: string}[], 
    arsenal: Ball[], 
    categoryName: string,
    usedBalls: Set<string>
  ): Ball | null {
    
    // First, try exact name match for any of the recommended balls
    for (const recommendedBall of ballOptions) {
      const exactMatch = arsenal.find(ball => 
        !usedBalls.has(ball.ball_name) &&
        (ball.ball_name.toLowerCase().includes(recommendedBall.name.toLowerCase()) ||
         recommendedBall.name.toLowerCase().includes(ball.ball_name.toLowerCase()))
      );
      if (exactMatch) return exactMatch;
    }

    // Then try to match by characteristics based on category
    let match: Ball | undefined;
    
    if (categoryName.includes('solid reactive')) {
      match = arsenal.find(ball => 
        !usedBalls.has(ball.ball_name) &&
        (ball.coverstock_type?.toLowerCase().includes('solid') ||
         ball.ball_name.toLowerCase().includes('phaze') ||
         ball.ball_name.toLowerCase().includes('jackal') ||
         ball.ball_name.toLowerCase().includes('kingpin'))
      );
    } else if (categoryName.includes('benchmark')) {
      match = arsenal.find(ball =>
        !usedBalls.has(ball.ball_name) &&
        (ball.ball_name.toLowerCase().includes('iq tour') ||
         ball.ball_name.toLowerCase().includes('hustle') ||
         ball.ball_name.toLowerCase().includes('rhino') ||
         ball.coverstock_type?.toLowerCase().includes('hybrid'))
      );
    } else if (categoryName.includes('urethane')) {
      match = arsenal.find(ball =>
        !usedBalls.has(ball.ball_name) &&
        (ball.coverstock_type?.toLowerCase().includes('urethane') ||
         ball.coverstock_type?.toLowerCase().includes('polyester') ||
         ball.ball_name.toLowerCase().includes('mix') ||
         ball.ball_name.toLowerCase().includes('purple pearl'))
      );
    } else if (categoryName.includes('pearl reactive')) {
      match = arsenal.find(ball =>
        !usedBalls.has(ball.ball_name) &&
        (ball.coverstock_type?.toLowerCase().includes('pearl') ||
         ball.ball_name.toLowerCase().includes('tropical') ||
         ball.ball_name.toLowerCase().includes('freestyle'))
      );
    } else if (categoryName.includes('strong reactive')) {
      match = arsenal.find(ball =>
        !usedBalls.has(ball.ball_name) &&
        (ball.coverstock_type?.toLowerCase().includes('solid') ||
         ball.coverstock_type?.toLowerCase().includes('hybrid') ||
         ball.ball_name.toLowerCase().includes('black widow') ||
         ball.ball_name.toLowerCase().includes('eruption'))
      );
    }

    return match || null;
  }
}