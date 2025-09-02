import { Injectable } from '@angular/core';
import { BowlingOrganization, Rulebook, RulebookSection } from '../../models/rulebook.model';

@Injectable({
  providedIn: 'root',
})
export class RulebookDataService {
  
  private readonly organizations: BowlingOrganization[] = [
    { code: 'USBC', name: 'United States Bowling Congress', country: 'United States' },
    { code: 'BC', name: 'Bowls Canada', country: 'Canada' },
    { code: 'EBF', name: 'European Bowling Federation', country: 'Europe' },
    { code: 'DBV', name: 'Deutscher Bowling Verband', country: 'Germany' },
    { code: 'BCGBA', name: 'British Crown Green Bowling Association', country: 'United Kingdom' },
    { code: 'BFA', name: 'Bowling Federation of Australia', country: 'Australia' },
    { code: 'JBC', name: 'Japan Bowling Congress', country: 'Japan' },
  ];

  getOrganizations(): BowlingOrganization[] {
    return this.organizations;
  }

  getRulebook(organizationCode: string): Rulebook {
    const organization = this.organizations.find(org => org.code === organizationCode);
    if (!organization) {
      throw new Error(`Organization with code ${organizationCode} not found`);
    }

    switch (organizationCode) {
      case 'USBC':
        return this.getUSBCRulebook(organization);
      case 'BC':
        return this.getBowlsCanadaRulebook(organization);
      case 'EBF':
        return this.getEBFRulebook(organization);
      case 'DBV':
        return this.getDBVRulebook(organization);
      case 'BCGBA':
        return this.getBCGBARulebook(organization);
      case 'BFA':
        return this.getBFARulebook(organization);
      case 'JBC':
        return this.getJBCRulebook(organization);
      default:
        throw new Error(`Rulebook not available for organization ${organizationCode}`);
    }
  }

  private getUSBCRulebook(organization: BowlingOrganization): Rulebook {
    const sections: RulebookSection[] = [
      {
        title: 'Basic Rules and Regulations',
        content: `Standard bowling rules and game regulations as defined by the USBC. Ten frames constitute a complete game. Each frame allows up to two deliveries except the tenth frame. A strike is scored when all pins are knocked down with the first delivery. A spare is scored when all pins are knocked down with two deliveries in a frame. The maximum score for a game is 300 points. Players must observe proper bowling etiquette and lane courtesy at all times.`,
        order: 1
      },
      {
        title: 'Equipment Standards',
        content: `USBC approved bowling balls must not exceed 16 pounds in weight and 8.595 inches in diameter. Balls must be constructed of non-metallic materials. Bowling shoes must have non-marking soles with proper sliding and braking capabilities. Players may use approved bowling aids such as wrist supports and finger inserts. All equipment must meet current USBC specifications and be properly maintained.`,
        order: 2
      },
      {
        title: 'Scoring System',
        content: `Official USBC scoring methods and procedures. Strikes are marked with an "X" and score 10 plus the next two deliveries. Spares are marked with a "/" and score 10 plus the next delivery. Open frames score the total pins knocked down. In the tenth frame, strikes and spares earn bonus deliveries. The cumulative scoring system adds each frame to the previous total. Automatic scoring systems are preferred but manual scoring is permitted when properly supervised.`,
        order: 3
      },
      {
        title: 'Tournament Guidelines',
        content: `Rules specific to USBC sanctioned tournament play and competitions. All tournaments must be USBC sanctioned with proper registration and fees. Handicap systems must follow USBC guidelines using 90% of the difference from 220. Tournament formats include scratch and handicap divisions. Protest procedures must be followed for disputed calls. Prize ratios and entry fees must comply with USBC regulations. Drug and alcohol policies are strictly enforced during competition.`,
        order: 4
      },
      {
        title: 'League Play Standards',
        content: `Regulations for USBC sanctioned league bowling and seasonal play. Leagues must have a minimum of eight teams with at least three players per team. Season length should be at least 14 weeks. Handicaps are calculated using 90% of 220 average. Makeup rules allow for missed games within specific timeframes. Awards must meet USBC prize ratio requirements. League officers must be elected and maintain proper records. All participants must hold current USBC membership.`,
        order: 5
      }
    ];

    return {
      organization,
      title: 'United States Bowling Congress Official Rulebook',
      version: '2024.1',
      lastUpdated: '2024-01-15',
      sections
    };
  }

  private getBowlsCanadaRulebook(organization: BowlingOrganization): Rulebook {
    const sections: RulebookSection[] = [
      {
        title: 'Basic Rules and Regulations',
        content: `Official Bowls Canada playing rules and regulations. Games consist of predetermined number of ends based on competition format. Players alternate deliveries within each end. The jack is rolled first to establish the target. Bowls must be delivered underarm from the mat area. Players must stand behind the mat when not delivering. Dead bowls that leave the rink boundaries are removed from play.`,
        order: 1
      },
      {
        title: 'Equipment Standards',
        content: `Bowls Canada approved equipment specifications. Bowls must be manufactured to World Bowls specifications with approved bias. Jack must be white or yellow and regulation size. Mats must be regulation size and properly positioned. Players must wear appropriate flat-soled shoes. Measuring equipment must be accurate and properly calibrated. All equipment subject to inspection by officials.`,
        order: 2
      },
      {
        title: 'Scoring System',
        content: `Official Bowls Canada scoring methods. Points are awarded for bowls closer to the jack than opponent's nearest bowl. Only one side can score in each end. The side with bowls closest to the jack scores one point for each qualifying bowl. Games are played to predetermined point total or number of ends. Scorecards must be maintained accurately and signed by players.`,
        order: 3
      },
      {
        title: 'Tournament Guidelines',
        content: `Bowls Canada sanctioned tournament regulations and procedures. All tournaments must be registered with Bowls Canada. Entry requirements include current membership and skill level classification. Time limits are enforced for games and individual deliveries. Dress code requirements must be followed. Umpires have final authority on disputed calls. Prize distribution must follow Bowls Canada guidelines.`,
        order: 4
      },
      {
        title: 'League Play Standards',
        content: `Standards for Bowls Canada affiliated league play. League structure requires minimum number of teams and players. Season scheduling must accommodate weather and facility constraints. Handicap systems may be used based on player skill levels. Substitute player rules allow for temporary replacements. Awards and recognition programs encourage participation and achievement.`,
        order: 5
      }
    ];

    return {
      organization,
      title: 'Bowls Canada Official Rules and Regulations',
      version: '2024.2',
      lastUpdated: '2024-02-01',
      sections
    };
  }

  private getEBFRulebook(organization: BowlingOrganization): Rulebook {
    const sections: RulebookSection[] = [
      {
        title: 'Basic Rules and Regulations',
        content: `European Bowling Federation standardized rules for ten-pin bowling. Games consist of ten frames with standard American ten-pin scoring. Players must observe international bowling etiquette and safety procedures. Lane conditions and oil patterns must meet EBF specifications. Equipment certification follows World Bowling standards. Competition rules align with international tournament play requirements.`,
        order: 1
      },
      {
        title: 'Equipment Standards',
        content: `EBF approved equipment specifications following World Bowling guidelines. Bowling balls must be ETBF certified and within weight and size limits. Lane surfaces and pin specifications must meet international standards. Automatic scoring systems must be World Bowling approved. Player equipment including shoes and accessories must comply with safety requirements.`,
        order: 2
      },
      {
        title: 'Scoring System',
        content: `International ten-pin bowling scoring system as standardized by World Bowling. Frame-by-frame cumulative scoring with strikes and spares calculated according to international rules. Digital scoring systems must display running totals and frame details. Manual backup scoring procedures available when required. Tournament scoring includes verification protocols.`,
        order: 3
      },
      {
        title: 'Tournament Guidelines',
        content: `EBF sanctioned tournament procedures for European competitions. Player eligibility requires current national federation membership. Tournament formats include individual, team, and all-events competitions. Anti-doping regulations strictly enforced per World Bowling policies. International officials certified through EBF training programs. Prize money distributions follow established guidelines.`,
        order: 4
      },
      {
        title: 'League Play Standards',
        content: `European league bowling standards and organizational requirements. National federations establish local league structures. International exchange programs promote bowling development. Youth and senior divisions encourage broad participation. Training programs for coaches and officials maintain quality standards. Statistical reporting systems track participation and performance trends.`,
        order: 5
      }
    ];

    return {
      organization,
      title: 'European Bowling Federation Official Regulations',
      version: '2024.1',
      lastUpdated: '2024-01-20',
      sections
    };
  }

  private getDBVRulebook(organization: BowlingOrganization): Rulebook {
    const sections: RulebookSection[] = [
      {
        title: 'Grundregeln und Vorschriften',
        content: `Deutscher Bowling Verband offizielle Spielregeln. Ein Spiel besteht aus zehn Frames mit standardmäßiger Punktezählung. Spieler müssen die Bowling-Etikette und Sicherheitsvorschriften beachten. Bahnbedingungen müssen den DBV-Spezifikationen entsprechen. Ausrüstung muss den internationalen Standards entsprechen. Wettkampfregeln folgen den World Bowling Richtlinien.`,
        order: 1
      },
      {
        title: 'Ausrüstungsstandards',
        content: `DBV genehmigte Ausrüstungsspezifikationen nach World Bowling Richtlinien. Bowlingkugeln müssen ETBF-zertifiziert und innerhalb der Gewichts- und Größengrenzen sein. Bahnoberflächen und Pin-Spezifikationen müssen internationalen Standards entsprechen. Automatische Anzeigesysteme müssen World Bowling-zertifiziert sein. Spielerausrüstung einschließlich Schuhe müssen Sicherheitsanforderungen erfüllen.`,
        order: 2
      },
      {
        title: 'Punktesystem',
        content: `Internationales Ten-Pin-Bowling-Punktesystem standardisiert durch World Bowling. Frame-für-Frame kumulative Punktezählung mit Strikes und Spares nach internationalen Regeln berechnet. Digitale Anzeigesysteme müssen laufende Summen und Frame-Details anzeigen. Manuelle Backup-Punktezählungsverfahren verfügbar wenn erforderlich.`,
        order: 3
      },
      {
        title: 'Turnierrichtlinien',
        content: `DBV sanktionierte Turnierverfahren für deutsche Wettkämpfe. Spielerberechtigung erfordert aktuelle Verbandsmitgliedschaft. Turnierformate umfassen Einzel-, Team- und All-Events-Wettkämpfe. Anti-Doping-Vorschriften streng durchgesetzt nach World Bowling Richtlinien. Lizenzierte Offizielle durch DBV-Ausbildungsprogramme zertifiziert.`,
        order: 4
      },
      {
        title: 'Ligaspielstandards',
        content: `Deutsche Ligaspielstandards und organisatorische Anforderungen. Lokale Ligastrukturen etabliert durch Landesverbände. Jugend- und Seniorenabteilungen fördern breite Teilnahme. Ausbildungsprogramme für Trainer und Offizielle erhalten Qualitätsstandards. Statistische Berichtssysteme verfolgen Teilnahme und Leistungstrends.`,
        order: 5
      }
    ];

    return {
      organization,
      title: 'Deutscher Bowling Verband Offizielles Regelbuch',
      version: '2024.1',
      lastUpdated: '2024-01-10',
      sections
    };
  }

  private getBCGBARulebook(organization: BowlingOrganization): Rulebook {
    const sections: RulebookSection[] = [
      {
        title: 'Basic Rules and Regulations',
        content: `British Crown Green Bowling Association official playing rules. Games played on crown green with natural grass surface. Players use biased bowls delivered to various positions on green. Jack can be placed anywhere on playable area within boundaries. Games typically played to predetermined number of points or ends. Players must observe traditional bowling etiquette and sportsmanship.`,
        order: 1
      },
      {
        title: 'Equipment Standards',
        content: `BCGBA approved equipment specifications for crown green bowling. Bowls must be regulation size and weight with appropriate bias. Jacks must be regulation white or yellow. Footwear must be flat-soled and non-damaging to green surface. Measuring equipment must be accurate and properly maintained. All equipment subject to inspection by qualified officials.`,
        order: 2
      },
      {
        title: 'Scoring System',
        content: `Traditional crown green bowling scoring methods. Points awarded for bowls nearest to jack after each end. Players alternate turns throughout the game. Winner determined by first to reach agreed point total. Scorecards maintained by players or designated marker. Disputes resolved by qualified umpire when available.`,
        order: 3
      },
      {
        title: 'Tournament Guidelines',
        content: `BCGBA sanctioned tournament procedures and regulations. Entry requirements include current association membership. Tournament formats vary from singles to team competitions. Handicap systems may be applied based on player ability. Time limits enforced to maintain schedule. Prize money and awards distributed according to association guidelines.`,
        order: 4
      },
      {
        title: 'League Play Standards',
        content: `Standards for BCGBA affiliated league competitions. League structure accommodates various skill levels and age groups. Seasonal play adjusted for weather conditions and green availability. Team formations and substitute rules clearly defined. Awards programs recognize achievement and participation. Administrative procedures ensure proper record keeping.`,
        order: 5
      }
    ];

    return {
      organization,
      title: 'British Crown Green Bowling Association Rules',
      version: '2024.1',
      lastUpdated: '2024-01-05',
      sections
    };
  }

  private getBFARulebook(organization: BowlingOrganization): Rulebook {
    const sections: RulebookSection[] = [
      {
        title: 'Basic Rules and Regulations',
        content: `Bowling Federation of Australia standard ten-pin bowling rules. Games consist of ten frames following international scoring system. Players must maintain proper bowling etiquette and lane courtesy. Competition conducted under World Bowling regulations and Australian sporting guidelines. Safety procedures strictly enforced in all bowling centers.`,
        order: 1
      },
      {
        title: 'Equipment Standards',
        content: `BFA approved equipment meeting World Bowling specifications. Bowling balls must be certified and within regulation limits for weight and size. Lane conditioning and pin setting equipment must meet international standards. Automatic scoring systems certified for competitive play. Player equipment including shoes must meet safety and performance requirements.`,
        order: 2
      },
      {
        title: 'Scoring System',
        content: `International ten-pin scoring system adopted by BFA. Cumulative scoring with strikes, spares, and open frames calculated per World Bowling rules. Electronic scoring systems preferred with manual backup procedures available. Tournament scoring includes verification and protest procedures. Statistical compilation follows international standards.`,
        order: 3
      },
      {
        title: 'Tournament Guidelines',
        content: `BFA sanctioned tournament procedures for Australian competitions. Player eligibility requires current BFA membership through state associations. Tournament formats include various individual and team competitions. Anti-doping policies enforced according to Australian Sports Anti-Doping Authority guidelines. Officials training and certification through BFA programs.`,
        order: 4
      },
      {
        title: 'League Play Standards',
        content: `Australian bowling league standards and organizational structure. State associations coordinate local league activities. Handicap systems and average calculations follow established guidelines. Youth development programs promote junior participation. Senior bowling divisions accommodate older players. Awards and recognition programs celebrate achievements at all levels.`,
        order: 5
      }
    ];

    return {
      organization,
      title: 'Bowling Federation of Australia Official Rules',
      version: '2024.1',
      lastUpdated: '2024-01-12',
      sections
    };
  }

  private getJBCRulebook(organization: BowlingOrganization): Rulebook {
    const sections: RulebookSection[] = [
      {
        title: 'Basic Rules and Regulations',
        content: `Japan Bowling Congress official ten-pin bowling rules. Games follow international ten-pin format with ten frames per game. Japanese bowling etiquette emphasizes respect and courtesy. Competition rules align with World Bowling standards while incorporating Japanese cultural elements. Safety protocols strictly maintained in all certified bowling centers.`,
        order: 1
      },
      {
        title: 'Equipment Standards',
        content: `JBC approved equipment conforming to World Bowling specifications. Bowling balls must be ETBF/USBC certified with proper weight and dimension limits. Lane surfaces, pin specifications, and automatic equipment must meet international standards. Player equipment including shoes and accessories must comply with safety requirements and JBC guidelines.`,
        order: 2
      },
      {
        title: 'Scoring System',
        content: `International ten-pin bowling scoring system standardized through World Bowling. Frame-by-frame scoring with strikes marked as "X" and spares marked as "/". Electronic scoring systems display both English and Japanese language options. Manual scoring procedures available with proper supervision. Tournament scoring includes official verification processes.`,
        order: 3
      },
      {
        title: 'Tournament Guidelines',
        content: `JBC sanctioned tournament procedures for Japanese competitions. Player eligibility requires current JBC membership and registration. Tournament formats include individual, team, and special event competitions. Drug testing policies follow Japan Anti-Doping Agency guidelines. International officials and technical delegates certified through JBC training programs.`,
        order: 4
      },
      {
        title: 'League Play Standards',
        content: `Japanese bowling league standards and organizational requirements. Corporate and recreational leagues structured through JBC guidelines. Handicap systems accommodate players of varying skill levels. Youth development programs in schools and communities. Senior bowling divisions for older adult participation. Statistical record keeping follows international and domestic requirements.`,
        order: 5
      }
    ];

    return {
      organization,
      title: 'Japan Bowling Congress Official Rulebook',
      version: '2024.1',
      lastUpdated: '2024-01-08',
      sections
    };
  }
}