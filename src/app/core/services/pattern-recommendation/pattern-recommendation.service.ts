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

    // Heavy oil conditions (Very High/High volume)
    if (volume === 'Very High' || volume === 'High') {
      if (length === 'Short' && difficulty === 'Hard') {
        return 'Short heavy oil patterns require strong solid reactive balls with high differential for early roll. Focus on balls that create traction in oil while maintaining energy through the pins.';
      } else if (length === 'Short') {
        return 'Short heavy patterns allow for aggressive asymmetric balls. Use strong solid reactive with controlled layouts to handle the oil volume while creating sharp backend motion.';
      } else if (length === 'Long' && difficulty === 'Hard') {
        return 'Long heavy sport patterns demand patience and precision. Use strong solid reactive balls with clean layouts for predictable, continuous motion through heavy oil.';
      } else if (length === 'Long') {
        return 'Long heavy patterns benefit from strong hybrid reactive balls that can store energy through the oil and create controlled backend reaction.';
      } else {
        // Medium length
        return difficulty === 'Hard'
          ? 'Medium-length heavy patterns need versatile solid reactive balls with balanced core dynamics for consistent motion.'
          : 'Medium heavy oil allows for both solid and hybrid reactive options - choose based on desired backend shape.';
      }
    }
    // Medium oil conditions
    else if (volume === 'Medium') {
      if (length === 'Short' && difficulty === 'Hard') {
        return 'Short medium oil sport patterns require precise ball selection. Use benchmark reactive balls with proven track records for controlled, repeatable motion.';
      } else if (length === 'Short') {
        return 'Short medium patterns offer flexibility. Start with benchmark reactive and adjust to pearl reactive for increased backend as conditions change.';
      } else if (length === 'Long' && difficulty === 'Hard') {
        return 'Long medium sport patterns demand consistency above all. Use proven benchmark balls with predictable motion characteristics.';
      } else if (length === 'Long') {
        return 'Long medium patterns allow for strategic ball progression. Start conservative with hybrid reactive, move to pearl reactive as pattern breaks down.';
      } else {
        // Medium length
        return 'Medium-length, medium-oil patterns are ideal for benchmark reactive balls. These versatile options handle various line adjustments throughout play.';
      }
    }
    // Light oil conditions
    else {
      if (length === 'Short' && difficulty === 'Hard') {
        return 'Short light oil sport patterns are extremely challenging. Use urethane or very weak reactive balls to prevent over-reaction and maintain pocket entry angle.';
      } else if (length === 'Short') {
        return 'Short light patterns create lots of backend motion. Use urethane for control or light oil reactive with surface adjustments to manage the reaction.';
      } else if (length === 'Long' && difficulty === 'Hard') {
        return 'Long light sport patterns require extreme precision. Urethane balls provide the control needed, with minimal axis rotation techniques.';
      } else if (length === 'Long') {
        return 'Long light patterns eventually open up. Start with urethane or weak reactive, then transition to stronger options as friction increases.';
      } else {
        // Medium length
        return difficulty === 'Hard'
          ? 'Medium light sport patterns need controlled motion. Use urethane or entry-level reactive balls with conservative layouts.'
          : 'Medium light patterns offer good scoring opportunities. Use light oil reactive balls that create controlled backend motion.';
      }
    }
  }

  private getSpecificBallRecommendations(criteria: RecommendationCriteria): string[] {
    // Build a 3-ball arsenal strategy based on comprehensive pattern analysis
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
    const { arsenal } = criteria;
    const recommendations: string[] = [];
    const usedArsenalBalls = new Set<string>();

    // Define the three ball categories needed based on comprehensive pattern analysis
    const ballCategories = this.getPatternSpecificBallCategories(criteria);

    ballCategories.forEach((category) => {
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

    // Add pattern-specific arsenal note
    const transitionNote = this.getTransitionNote(criteria);
    recommendations.push(`Arsenal Note: ${transitionNote}`);

    return recommendations;
  }

  private getPatternSpecificBallCategories(criteria: RecommendationCriteria) {
    const { volume, difficulty, length } = criteria;
    const categories = [];

    // Heavy oil patterns (Very High/High volume)
    if (volume === 'Very High' || volume === 'High') {
      if (length === 'Short') {
        // Short heavy patterns - need early hook and control
        categories.push({
          categoryName: 'aggressive solid reactive',
          purpose: 'primary option for short heavy oil - creates early traction and strong backend',
          ballOptions: [
            { name: 'Storm Phaze II', year: '2018', description: 'Proven benchmark solid for heavy oil start' },
            { name: 'Motiv Jackal Ghost', year: '2021', description: 'Aggressive asymmetric for maximum oil handling' },
            { name: 'Brunswick Kingpin Max', year: '2020', description: 'Strong continuous motion through heavy oil' },
            { name: 'Roto Grip Rubicon UC3', year: '2022', description: 'Latest technology for heavy oil patterns' },
            { name: 'DV8 Brutal Nightmare', year: '2023', description: 'High-performance solid for challenging conditions' },
          ],
        });

        categories.push({
          categoryName: 'hybrid reactive',
          purpose: 'transition ball when heavy oil starts to carry down',
          ballOptions: [
            { name: 'Storm IQ Tour Emerald', year: '2023', description: 'Modern benchmark hybrid for transitions' },
            { name: 'Hammer Black Widow 2.0', year: '2019', description: 'Reliable hybrid for changing conditions' },
            { name: 'Columbia 300 Eruption Pro', year: '2017', description: 'Proven tournament ball for oil transitions' },
            { name: 'Motiv Venom Shock', year: '2018', description: 'Versatile hybrid for medium-heavy transitions' },
            { name: 'Roto Grip Winner', year: '2020', description: 'Smooth hybrid motion for pattern breakdown' },
          ],
        });

        categories.push({
          categoryName: 'control option',
          purpose: 'late-game control when pattern breaks down significantly',
          ballOptions: [
            { name: 'Storm Mix', year: '2022', description: 'Modern urethane for ultimate control' },
            { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable urethane motion' },
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Light oil reactive for broken-down conditions' },
            { name: 'Brunswick Rhino', year: 'Classic', description: 'Entry-level reactive for control' },
            { name: 'Motiv Desert Tank', year: '2019', description: 'Urethane for precision shots' },
          ],
        });
      } else if (length === 'Long') {
        // Long heavy patterns - need patience and energy retention
        categories.push({
          categoryName: 'strong symmetrical solid',
          purpose: 'primary option for long heavy patterns - stores energy and creates predictable motion',
          ballOptions: [
            { name: 'Storm Phaze II', year: '2018', description: 'Gold standard for long heavy patterns' },
            { name: 'Roto Grip Rubicon UC3', year: '2022', description: 'Latest solid technology for length and strength' },
            { name: 'Brunswick Kingpin Max', year: '2020', description: 'Continuous strong motion for long patterns' },
            { name: 'Motiv Pride Dynasty', year: '2023', description: 'Modern solid for challenging long patterns' },
            { name: 'DV8 Misfit Pearl', year: '2023', description: 'Strong pearl for length with backend' },
          ],
        });

        categories.push({
          categoryName: 'moderate benchmark',
          purpose: 'step-down option when oil volume decreases',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'Perfect benchmark for pattern transitions' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Reliable medium-strength option' },
            { name: 'DV8 Misfit', year: '2023', description: 'Controlled motion for changing conditions' },
            { name: 'Columbia 300 Chaos', year: '2021', description: 'Versatile for various oil volumes' },
            { name: 'Brunswick Rhino Pro', year: '2022', description: 'Updated classic for reliability' },
          ],
        });

        categories.push({
          categoryName: 'control precision',
          purpose:
            difficulty === 'Hard' ? 'precision option for extremely challenging sport patterns' : 'late-game control when conditions become lighter',
          ballOptions: [
            { name: 'Storm Mix', year: '2022', description: 'Ultimate control for sport patterns' },
            { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable motion for precision' },
            { name: 'Brunswick T-Zone', year: 'Classic', description: 'Straight ball option for difficult conditions' },
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Light reactive for pattern breakdown' },
            { name: 'Motiv Desert Tank', year: '2019', description: 'Urethane for ultimate precision' },
          ],
        });
      } else {
        // Medium length heavy patterns - balanced approach
        categories.push({
          categoryName: 'versatile solid reactive',
          purpose: 'primary option for medium-length heavy oil',
          ballOptions: [
            { name: 'Storm Phaze II', year: '2018', description: 'Versatile solid for various heavy conditions' },
            { name: 'Motiv Jackal Ghost', year: '2021', description: 'Strong asymmetric for medium-heavy patterns' },
            { name: 'Roto Grip Rubicon UC3', year: '2022', description: 'Latest solid technology' },
            { name: 'Brunswick Kingpin Max', year: '2020', description: 'Reliable heavy oil option' },
            { name: 'DV8 Brutal Nightmare', year: '2023', description: 'High-performance for challenging conditions' },
          ],
        });

        categories.push({
          categoryName: 'hybrid benchmark',
          purpose: 'transition ball for changing medium-heavy conditions',
          ballOptions: [
            { name: 'Storm IQ Tour Emerald', year: '2023', description: 'Modern hybrid benchmark' },
            { name: 'Hammer Black Widow 2.0', year: '2019', description: 'Proven hybrid performance' },
            { name: 'Columbia 300 Eruption Pro', year: '2017', description: 'Tournament-tested hybrid' },
            { name: 'Motiv Venom Shock', year: '2018', description: 'Versatile for transitions' },
            { name: 'Roto Grip Winner', year: '2020', description: 'Smooth hybrid motion' },
          ],
        });

        categories.push({
          categoryName: 'lighter reactive',
          purpose: 'late-game option when conditions lighten up',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'Benchmark for lighter transitions' },
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Light oil reactive' },
            { name: 'Motiv Freestyle Rush', year: '2023', description: 'Pearl reactive for changing conditions' },
            { name: 'Brunswick Rhino', year: 'Classic', description: 'Entry-level for control' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Reliable medium-light option' },
          ],
        });
      }
    }
    // Medium oil conditions
    else if (volume === 'Medium') {
      if (length === 'Short') {
        // Short medium patterns - versatile options needed
        categories.push({
          categoryName: 'benchmark reactive',
          purpose: 'primary option for short medium oil patterns',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'Perfect benchmark for medium conditions' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Reliable medium oil starter' },
            { name: 'DV8 Misfit', year: '2023', description: 'Modern benchmark with great versatility' },
            { name: 'Columbia 300 Chaos', year: '2021', description: 'Versatile for various conditions' },
            { name: 'Brunswick Rhino Pro', year: '2022', description: 'Updated classic benchmark' },
          ],
        });

        categories.push({
          categoryName: 'pearl reactive',
          purpose: 'step-up option when you need more backend reaction',
          ballOptions: [
            { name: 'Storm IQ Tour Emerald', year: '2023', description: 'Modern pearl for increased hook' },
            { name: 'Motiv Jackal Ghost Pearl', year: '2022', description: 'Strong pearl for backend motion' },
            { name: 'DV8 Misfit Pearl', year: '2023', description: 'Pearl version for more backend' },
            { name: 'Hammer Black Widow 2.0 Pearl', year: '2020', description: 'Pearl for angular motion' },
            { name: 'Columbia 300 Scout Pearl', year: '2022', description: 'Entry-level pearl reactive' },
          ],
        });

        categories.push({
          categoryName: 'control urethane',
          purpose: difficulty === 'Hard' ? 'precision control for challenging sport patterns' : 'control option for over-reaction conditions',
          ballOptions: [
            { name: 'Storm Mix', year: '2022', description: 'Modern urethane for control' },
            { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable urethane motion' },
            { name: 'Brunswick T-Zone', year: 'Classic', description: 'Polyester for ultimate control' },
            { name: 'Motiv Desert Tank', year: '2019', description: 'Urethane for precision' },
            { name: 'Storm Pitch Black', year: '2017', description: 'Classic urethane option' },
          ],
        });
      } else if (length === 'Long') {
        // Long medium patterns - patience and progression
        categories.push({
          categoryName: 'moderate solid reactive',
          purpose: 'primary option for long medium patterns',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'Ideal for long medium conditions' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Reliable for longer patterns' },
            { name: 'DV8 Misfit', year: '2023', description: 'Controlled motion for length' },
            { name: 'Motiv Venom Shock', year: '2018', description: 'Hybrid for long patterns' },
            { name: 'Columbia 300 Chaos', year: '2021', description: 'Versatile for pattern progression' },
          ],
        });

        categories.push({
          categoryName: 'pearl reactive',
          purpose: 'step-up when pattern breaks down and you need more backend',
          ballOptions: [
            { name: 'Storm IQ Tour Emerald', year: '2023', description: 'Pearl for increased hook potential' },
            { name: 'Motiv Jackal Ghost Pearl', year: '2022', description: 'Strong pearl for backend' },
            { name: 'DV8 Misfit Pearl', year: '2023', description: 'Modern pearl technology' },
            { name: 'Hammer Black Widow 2.0 Pearl', year: '2020', description: 'Angular pearl motion' },
            { name: 'Storm Tropical Surge', year: '2023', description: 'Latest pearl technology' },
          ],
        });

        categories.push({
          categoryName: 'control precision',
          purpose: difficulty === 'Hard' ? 'ultimate precision for challenging sport patterns' : 'control option when conditions get tricky',
          ballOptions: [
            { name: 'Storm Mix', year: '2022', description: 'Modern urethane control' },
            { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable urethane' },
            { name: 'Brunswick T-Zone', year: 'Classic', description: 'Straight ball precision' },
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Light reactive control' },
            { name: 'Motiv Desert Tank', year: '2019', description: 'Urethane precision' },
          ],
        });
      } else {
        // Medium length medium patterns - ideal conditions for benchmarks
        categories.push({
          categoryName: 'benchmark reactive',
          purpose: 'perfect starting point for medium-medium conditions',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'The gold standard benchmark' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Proven benchmark reliability' },
            { name: 'DV8 Misfit', year: '2023', description: 'Modern benchmark technology' },
            { name: 'Columbia 300 Chaos', year: '2021', description: 'Versatile benchmark option' },
            { name: 'Brunswick Rhino Pro', year: '2022', description: 'Updated classic benchmark' },
          ],
        });

        categories.push({
          categoryName: 'step-up reactive',
          purpose: 'stronger option when you need more hook or backend',
          ballOptions: [
            { name: 'Storm IQ Tour Emerald', year: '2023', description: 'Step up from benchmark' },
            { name: 'Motiv Jackal Ghost', year: '2021', description: 'Strong option for more hook' },
            { name: 'Hammer Black Widow 2.0', year: '2019', description: 'Proven strong reactive' },
            { name: 'DV8 Brutal Nightmare', year: '2023', description: 'High-performance option' },
            { name: 'Columbia 300 Eruption Pro', year: '2017', description: 'Tournament-proven strong ball' },
          ],
        });

        categories.push({
          categoryName: 'step-down control',
          purpose: 'lighter option for control or when conditions play stronger',
          ballOptions: [
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Light reactive for control' },
            { name: 'Brunswick Rhino', year: 'Classic', description: 'Entry-level for lighter play' },
            { name: 'Storm Mix', year: '2022', description: 'Urethane for ultimate control' },
            { name: 'Motiv Freestyle Rush', year: '2023', description: 'Pearl for lighter conditions' },
            { name: 'Columbia 300 Scout Reactive', year: '2022', description: 'Entry-level control' },
          ],
        });
      }
    }
    // Light oil conditions
    else {
      if (length === 'Short') {
        // Short light patterns - extreme backend, need control
        categories.push({
          categoryName: 'urethane control',
          purpose: 'primary option to prevent over-reaction on short light oil',
          ballOptions: [
            { name: 'Storm Mix', year: '2022', description: 'Modern urethane for ultimate control' },
            { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable urethane motion' },
            { name: 'Motiv Desert Tank', year: '2019', description: 'Reliable urethane option' },
            { name: 'Storm Pitch Black', year: '2017', description: 'Classic urethane control' },
            { name: 'Brunswick T-Zone', year: 'Classic', description: 'Polyester for straight shots' },
          ],
        });

        categories.push({
          categoryName: 'light oil reactive',
          purpose: 'step-up option when you need more hook but still want control',
          ballOptions: [
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Light oil reactive with control' },
            { name: 'Brunswick Rhino', year: 'Classic', description: 'Entry-level reactive' },
            { name: 'Motiv Freestyle Rush', year: '2023', description: 'Modern light oil pearl' },
            { name: 'Columbia 300 Scout Reactive', year: '2022', description: 'Mild reactive motion' },
            { name: 'DV8 Polyester', year: '2020', description: 'Controlled reactive motion' },
          ],
        });

        categories.push({
          categoryName: 'benchmark transition',
          purpose: 'later option when oil gets pushed back and conditions change',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'Benchmark for when conditions open up' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Versatile for changing conditions' },
            { name: 'DV8 Misfit', year: '2023', description: 'Modern benchmark for transitions' },
            { name: 'Brunswick Rhino Pro', year: '2022', description: 'Updated benchmark option' },
            { name: 'Columbia 300 Chaos', year: '2021', description: 'Versatile for pattern changes' },
          ],
        });
      } else if (length === 'Long') {
        // Long light patterns - patience and progressive strength
        categories.push({
          categoryName: 'urethane precision',
          purpose: 'primary option for ultimate control on long light patterns',
          ballOptions: [
            { name: 'Storm Mix', year: '2022', description: 'Modern urethane for precision' },
            { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable long-pattern motion' },
            { name: 'Motiv Desert Tank', year: '2019', description: 'Reliable urethane control' },
            { name: 'Storm Pitch Black', year: '2017', description: 'Classic urethane option' },
            { name: 'Brunswick T-Zone', year: 'Classic', description: 'Straight ball for difficult conditions' },
          ],
        });

        categories.push({
          categoryName: 'controlled reactive',
          purpose: 'step-up when you need more hook but still want predictability',
          ballOptions: [
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Light reactive with control' },
            { name: 'Brunswick Rhino', year: 'Classic', description: 'Mild reactive motion' },
            { name: 'Columbia 300 Scout Reactive', year: '2022', description: 'Entry-level controlled reactive' },
            { name: 'Motiv Freestyle Rush', year: '2023', description: 'Modern controlled pearl' },
            { name: 'Roto Grip Hustle Wine', year: '2021', description: 'Light oil hybrid option' },
          ],
        });

        categories.push({
          categoryName: 'progressive benchmark',
          purpose: 'later option when pattern transitions and conditions become more hooking',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'Benchmark for progressive conditions' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Reliable for changing conditions' },
            { name: 'DV8 Misfit', year: '2023', description: 'Modern benchmark for transitions' },
            { name: 'Brunswick Rhino Pro', year: '2022', description: 'Progressive benchmark option' },
            { name: 'Columbia 300 Chaos', year: '2021', description: 'Versatile for pattern evolution' },
          ],
        });
      } else {
        // Medium length light patterns - balanced light oil approach
        categories.push({
          categoryName: 'light oil reactive',
          purpose: 'primary option for medium-length light oil conditions',
          ballOptions: [
            { name: 'Storm Tropical Breeze', year: '2021', description: 'Perfect for medium light conditions' },
            { name: 'Brunswick Rhino', year: 'Classic', description: 'Reliable light oil starter' },
            { name: 'Motiv Freestyle Rush', year: '2023', description: 'Modern light oil technology' },
            { name: 'Columbia 300 Scout Reactive', year: '2022', description: 'Controlled light oil motion' },
            { name: 'Roto Grip Hustle Wine', year: '2021', description: 'Light oil hybrid option' },
          ],
        });

        categories.push({
          categoryName: 'urethane control',
          purpose: difficulty === 'Hard' ? 'precision control for challenging sport patterns' : 'control option when reactive balls over-react',
          ballOptions: [
            { name: 'Storm Mix', year: '2022', description: 'Modern urethane control' },
            { name: 'Hammer Purple Pearl Urethane', year: '2020', description: 'Predictable urethane' },
            { name: 'Motiv Desert Tank', year: '2019', description: 'Reliable urethane option' },
            { name: 'Storm Pitch Black', year: '2017', description: 'Classic urethane' },
            { name: 'Brunswick T-Zone', year: 'Classic', description: 'Polyester for control' },
          ],
        });

        categories.push({
          categoryName: 'progressive benchmark',
          purpose: 'step-up option when conditions open up and you need more hook',
          ballOptions: [
            { name: 'Storm IQ Tour', year: '2020', description: 'Benchmark for progressive play' },
            { name: 'Roto Grip Hustle Ink', year: '2019', description: 'Versatile for changing conditions' },
            { name: 'DV8 Misfit', year: '2023', description: 'Modern benchmark technology' },
            { name: 'Brunswick Rhino Pro', year: '2022', description: 'Progressive benchmark' },
            { name: 'Columbia 300 Chaos', year: '2021', description: 'Versatile transition ball' },
          ],
        });
      }
    }

    return categories;
  }

  private findBestArsenalMatch(
    ballOptions: { name: string; year: string; description: string }[],
    arsenal: Ball[],
    categoryName: string,
    usedBalls: Set<string>,
  ): Ball | null {
    // First, try exact name match for any of the recommended balls
    for (const recommendedBall of ballOptions) {
      const exactMatch = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.ball_name.toLowerCase().includes(recommendedBall.name.toLowerCase()) ||
            recommendedBall.name.toLowerCase().includes(ball.ball_name.toLowerCase())),
      );
      if (exactMatch) return exactMatch;
    }

    // Enhanced matching by characteristics based on category and ball properties
    let match: Ball | undefined;

    // Heavy oil / aggressive balls
    if (categoryName.includes('aggressive solid reactive') || categoryName.includes('strong symmetrical solid')) {
      match = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.coverstock_type?.toLowerCase().includes('solid') ||
            // Look for known heavy oil balls by name patterns
            ball.ball_name.toLowerCase().includes('phaze') ||
            ball.ball_name.toLowerCase().includes('jackal') ||
            ball.ball_name.toLowerCase().includes('kingpin') ||
            ball.ball_name.toLowerCase().includes('axiom') ||
            ball.ball_name.toLowerCase().includes('proton') ||
            ball.ball_name.toLowerCase().includes('nuclear') ||
            ball.ball_name.toLowerCase().includes('virtual') ||
            ball.ball_name.toLowerCase().includes('reality') ||
            // High differential cores typically indicate stronger reaction
            (ball.core_diff && parseFloat(ball.core_diff) > 0.055)),
      );
    }
    // Hybrid reactive balls
    else if (categoryName.includes('hybrid reactive') || categoryName.includes('hybrid benchmark')) {
      match = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.coverstock_type?.toLowerCase().includes('hybrid') ||
            ball.ball_name.toLowerCase().includes('emerald') ||
            ball.ball_name.toLowerCase().includes('black widow') ||
            ball.ball_name.toLowerCase().includes('eruption') ||
            ball.ball_name.toLowerCase().includes('winner') ||
            ball.ball_name.toLowerCase().includes('venom') ||
            ball.ball_name.toLowerCase().includes('chaos') ||
            // Medium differential range for controlled strong reaction
            (ball.core_diff && parseFloat(ball.core_diff) >= 0.045 && parseFloat(ball.core_diff) <= 0.055)),
      );
    }
    // Benchmark/moderate reactive balls
    else if (categoryName.includes('benchmark') || categoryName.includes('moderate reactive') || categoryName.includes('versatile solid reactive')) {
      match = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.ball_name.toLowerCase().includes('iq tour') ||
            ball.ball_name.toLowerCase().includes('hustle') ||
            ball.ball_name.toLowerCase().includes('rhino') ||
            ball.ball_name.toLowerCase().includes('misfit') ||
            ball.ball_name.toLowerCase().includes('chaos') ||
            ball.ball_name.toLowerCase().includes('idol') ||
            ball.ball_name.toLowerCase().includes('lock') ||
            ball.ball_name.toLowerCase().includes('omega') ||
            // Look for moderate differential and RG values
            (ball.core_diff &&
              ball.core_rg &&
              parseFloat(ball.core_diff) >= 0.035 &&
              parseFloat(ball.core_diff) <= 0.05 &&
              parseFloat(ball.core_rg) >= 2.48 &&
              parseFloat(ball.core_rg) <= 2.55) ||
            // Hybrid coverstock often indicates benchmark characteristics
            ball.coverstock_type?.toLowerCase().includes('hybrid')),
      );
    }
    // Pearl reactive balls
    else if (categoryName.includes('pearl reactive') || categoryName.includes('step-up reactive')) {
      match = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.coverstock_type?.toLowerCase().includes('pearl') ||
            ball.ball_name.toLowerCase().includes('emerald') ||
            ball.ball_name.toLowerCase().includes('pearl') ||
            ball.ball_name.toLowerCase().includes('tropical surge') ||
            ball.ball_name.toLowerCase().includes('freestyle') ||
            ball.ball_name.toLowerCase().includes('scout') ||
            ball.ball_name.toLowerCase().includes('sure lock') ||
            // Higher RG with moderate differential for pearl characteristics
            (ball.core_rg &&
              ball.core_diff &&
              parseFloat(ball.core_rg) >= 2.5 &&
              parseFloat(ball.core_diff) >= 0.04 &&
              parseFloat(ball.core_diff) <= 0.055)),
      );
    }
    // Control/urethane balls
    else if (categoryName.includes('control') || categoryName.includes('urethane') || categoryName.includes('precision')) {
      match = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.coverstock_type?.toLowerCase().includes('urethane') ||
            ball.coverstock_type?.toLowerCase().includes('polyester') ||
            ball.ball_name.toLowerCase().includes('mix') ||
            ball.ball_name.toLowerCase().includes('purple pearl') ||
            ball.ball_name.toLowerCase().includes('t-zone') ||
            ball.ball_name.toLowerCase().includes('tropical breeze') ||
            ball.ball_name.toLowerCase().includes('desert tank') ||
            ball.ball_name.toLowerCase().includes('pitch black') ||
            // Low differential typically indicates control characteristics
            (ball.core_diff && parseFloat(ball.core_diff) <= 0.03)),
      );
    }
    // Light oil reactive balls
    else if (
      categoryName.includes('light oil reactive') ||
      categoryName.includes('lighter reactive') ||
      categoryName.includes('controlled reactive')
    ) {
      match = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.ball_name.toLowerCase().includes('tropical breeze') ||
            ball.ball_name.toLowerCase().includes('rhino') ||
            ball.ball_name.toLowerCase().includes('freestyle') ||
            ball.ball_name.toLowerCase().includes('scout') ||
            ball.ball_name.toLowerCase().includes('hustle wine') ||
            ball.ball_name.toLowerCase().includes('omega crux') ||
            // Pearl coverstock with lower differential for light oil
            (ball.coverstock_type?.toLowerCase().includes('pearl') && ball.core_diff && parseFloat(ball.core_diff) <= 0.045) ||
            // Lower differential solid reactive for control
            (ball.coverstock_type?.toLowerCase().includes('solid') && ball.core_diff && parseFloat(ball.core_diff) <= 0.04)),
      );
    }
    // Progressive/transition benchmark balls
    else if (categoryName.includes('progressive benchmark') || categoryName.includes('benchmark transition')) {
      match = arsenal.find(
        (ball) =>
          !usedBalls.has(ball.ball_name) &&
          (ball.ball_name.toLowerCase().includes('iq tour') ||
            ball.ball_name.toLowerCase().includes('hustle ink') ||
            ball.ball_name.toLowerCase().includes('misfit') ||
            ball.ball_name.toLowerCase().includes('rhino pro') ||
            ball.ball_name.toLowerCase().includes('chaos') ||
            ball.ball_name.toLowerCase().includes('idol') ||
            // Benchmark characteristics with versatility
            (ball.core_diff &&
              ball.core_rg &&
              parseFloat(ball.core_diff) >= 0.035 &&
              parseFloat(ball.core_diff) <= 0.05 &&
              parseFloat(ball.core_rg) >= 2.47 &&
              parseFloat(ball.core_rg) <= 2.56)),
      );
    }

    return match || null;
  }

  private getTransitionNote(criteria: RecommendationCriteria): string {
    const { volume, difficulty, length } = criteria;

    // Enhanced transition notes considering all three factors
    if (volume === 'Very High' || volume === 'High') {
      if (length === 'Short' && difficulty === 'Hard') {
        return 'Short heavy sport patterns: Start with the strongest solid reactive ball, move to hybrid for transitions, save urethane for extreme control needs. Pattern breaks down quickly, so be ready to adjust frequently.';
      } else if (length === 'Short') {
        return 'Short heavy patterns: Begin with aggressive solid reactive for heavy oil start, transition to hybrid as oil carries down, finish with control options when pattern breaks down significantly.';
      } else if (length === 'Long' && difficulty === 'Hard') {
        return 'Long heavy sport patterns: Use strong solid reactive for consistency throughout most of the session, step down to benchmark when oil volume decreases, reserve control ball for emergency situations.';
      } else if (length === 'Long') {
        return 'Long heavy patterns: Start with solid reactive, progress to benchmark as pattern transitions, use control option only when conditions become very light or broken down.';
      } else {
        return 'Medium heavy patterns: Begin with versatile solid reactive, move to hybrid for mid-game transitions, step down to lighter options as conditions change.';
      }
    } else if (volume === 'Light') {
      if (length === 'Short' && difficulty === 'Hard') {
        return 'Short light sport patterns: Start with urethane for ultimate control, carefully introduce light reactive only if needed, use benchmark sparingly for dramatic condition changes.';
      } else if (length === 'Short') {
        return 'Short light patterns: Begin with urethane to prevent over-reaction, step up to light reactive as needed, progress to benchmark when conditions allow for more hook.';
      } else if (length === 'Long' && difficulty === 'Hard') {
        return 'Long light sport patterns: Urethane is your primary weapon for precision, use controlled reactive sparingly, save benchmark for significant pattern progression.';
      } else if (length === 'Long') {
        return 'Long light patterns: Start conservative with urethane or light reactive, gradually progress to benchmark as friction increases and conditions become more hooking.';
      } else {
        return 'Medium light patterns: Begin with light reactive, use urethane for control when needed, step up to benchmark as conditions open up and become more scoreable.';
      }
    } else {
      // Medium volume
      if (difficulty === 'Hard') {
        return 'Medium oil sport patterns: Start with benchmark reactive for consistency, use control options for precision needs, step up to stronger reactive only when pattern breaks down significantly.';
      } else if (length === 'Short') {
        return 'Short medium patterns: Begin with benchmark, step up to pearl reactive for more backend, use control options if conditions play stronger than expected.';
      } else if (length === 'Long') {
        return 'Long medium patterns: Start with benchmark for predictable motion, progress to pearl reactive as pattern breaks down, maintain control options for precision shots.';
      } else {
        return 'Medium oil patterns provide ideal conditions for benchmark balls - start there and adjust up or down based on ball reaction and scoring pace.';
      }
    }
  }
}
