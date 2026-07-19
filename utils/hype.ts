import { Player } from '../data/players';
import { GameData } from '../hooks/useGames';
import { GameDetails, PlayerStat } from '../hooks/useGameDetails';
import { findPlayerStat } from './matchPlayer';

export interface PlayerHypeScore {
  player: Player;
  isPresent: boolean;
  score: number | null; // null tant que les vraies stats n'ont pas encore été chargées
  stat?: PlayerStat;
}

export interface HypeBreakdown {
  closenessScore: number;
  overtimeScore: number;
  intensityScore: number;
  incidentScore: number;
  playerScores: PlayerHypeScore[];
  total: number;
  verdict: string;
  verdictEmoji: string;
  summary: string;
  enriched: boolean; // true une fois les vraies données du match chargées
}

// Écart de score → note 0-10. Réutilisé pour l'écart final et l'écart du dernier quart-temps.
function closenessBucket(diff: number): number {
  if (diff <= 3) return 10;
  if (diff <= 6) return 9;
  if (diff <= 10) return 7;
  if (diff <= 15) return 5;
  if (diff <= 20) return 3;
  return 1;
}

function intensityScore(totalPoints: number): number {
  if (totalPoints >= 270) return 9;
  if (totalPoints >= 250) return 7;
  if (totalPoints >= 230) return 5;
  return 4;
}

function isPlayerInGame(player: Player, homeTeamAbbr: string, awayTeamAbbr: string): boolean {
  return player.team === homeTeamAbbr || player.team === awayTeamAbbr;
}

// Impact réel du joueur : le +/- reflète son influence sur le résultat,
// bonus pour une grosse ligne de stats (gros scoreur ou double-double).
function playerImpactScore(stat: PlayerStat): number {
  let score = 5 + stat.plusMinus / 4;
  if (stat.pts >= 30) score += 1.5;
  else if (stat.pts >= 20) score += 0.7;
  if (stat.ast >= 10 || stat.reb >= 10) score += 0.5;
  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

function incidentScoreFromDetails(details: GameDetails): number {
  if (details.hasEjection) return 10;
  if (details.hasFlagrant) return 7;
  if (details.incidentCount >= 3) return 5;
  if (details.incidentCount >= 1) return 3;
  return 0;
}

function computeTotal(
  closeness: number,
  overtime: number,
  intensity: number,
  incident: number,
  resolvedPlayerScores: number[]
): number {
  let total: number;
  if (resolvedPlayerScores.length > 0) {
    const avgPlayer = resolvedPlayerScores.reduce((a, b) => a + b, 0) / resolvedPlayerScores.length;
    total = closeness * 0.3 + overtime * 0.15 + intensity * 0.15 + incident * 0.1 + avgPlayer * 0.3;
  } else {
    total = closeness * 0.4 + overtime * 0.2 + intensity * 0.25 + incident * 0.15;
  }
  return Math.min(10, Math.max(0, Math.round(total * 10) / 10));
}

function verdictFor(total: number): { verdict: string; verdictEmoji: string } {
  if (total >= 8) return { verdict: 'À VOIR ABSOLUMENT', verdictEmoji: '🔥' };
  if (total >= 6) return { verdict: 'VAUT LE DÉTOUR', verdictEmoji: '👍' };
  if (total >= 4) return { verdict: 'PEUT-ÊTRE', verdictEmoji: '🤔' };
  return { verdict: 'PASSE TON TOUR', verdictEmoji: '💤' };
}

function buildSummary(
  diff: number,
  totalPoints: number,
  isOvertime: boolean,
  playerScores: PlayerHypeScore[],
  details?: GameDetails
): string {
  const parts: string[] = [];

  if (isOvertime) {
    parts.push('Le match est allé en prolongation — impossible de faire plus serré.');
  } else if (diff <= 3) {
    parts.push('Un duel haletant jusqu\'au dernier souffle — chaque possession comptait.');
  } else if (diff <= 6) {
    parts.push('Un match accroché, décidé dans les dernières minutes.');
  } else if (diff <= 10) {
    parts.push('Une rencontre serrée avec de nombreux rebondissements.');
  } else if (diff <= 20) {
    parts.push('Un écart qui s\'est creusé progressivement, quelques séquences intéressantes.');
  } else {
    parts.push('Une domination nette — peu de suspense au tableau de bord.');
  }

  if (totalPoints >= 270) {
    parts.push('Les deux équipes ont affiché une attaque de feu ce soir.');
  } else if (totalPoints >= 250) {
    parts.push('Bonne activité offensive des deux côtés.');
  }

  if (details?.hasEjection) {
    parts.push('Ambiance électrique : un joueur a été expulsé.');
  } else if (details?.hasFlagrant) {
    parts.push('Une faute flagrante a mis le feu aux poudres.');
  } else if ((details?.incidentCount ?? 0) >= 3) {
    parts.push('Le match s\'est envenimé, plusieurs fautes techniques ont été sifflées.');
  }

  const goodGames = playerScores.filter((ps) => ps.isPresent && (ps.score ?? 0) >= 7.5);
  const badGames = playerScores.filter((ps) => ps.isPresent && ps.score !== null && ps.score <= 3.5);
  if (goodGames.length > 0) {
    const names = goodGames.map((ps) => ps.player.name).join(' et ');
    parts.push(`${names} a/ont sorti un grand match.`);
  }
  if (badGames.length > 0) {
    const names = badGames.map((ps) => ps.player.name).join(' et ');
    parts.push(`Soirée à oublier en revanche pour ${names}.`);
  }

  return parts.join(' ');
}

// Score rapide, basé uniquement sur le scoreboard (disponible instantanément pour tous les matchs).
export function computeHypeQuick(game: GameData, favoritePlayers: Player[]): HypeBreakdown {
  const diff = Math.abs(game.homeTeam.score - game.awayTeam.score);
  const totalPoints = game.homeTeam.score + game.awayTeam.score;

  const closeness = closenessBucket(diff);
  const overtime = game.isOvertime ? 10 : 0;
  const intensity = intensityScore(totalPoints);
  const incident = 0; // inconnu tant que le détail du match n'est pas chargé

  const playerScores: PlayerHypeScore[] = favoritePlayers.map((player) => ({
    player,
    isPresent: isPlayerInGame(player, game.homeTeam.teamTricode, game.awayTeam.teamTricode),
    score: null,
  }));

  const total = computeTotal(closeness, overtime, intensity, incident, []);
  const { verdict, verdictEmoji } = verdictFor(total);

  return {
    closenessScore: closeness,
    overtimeScore: overtime,
    intensityScore: intensity,
    incidentScore: incident,
    playerScores,
    total,
    verdict,
    verdictEmoji,
    summary: buildSummary(diff, totalPoints, game.isOvertime, playerScores),
    enriched: false,
  };
}

// Affine le score avec les vraies données du match (boxscore, plays, stats d'équipe).
export function enrichHype(game: GameData, favoritePlayers: Player[], details: GameDetails): HypeBreakdown {
  const diff = Math.abs(game.homeTeam.score - game.awayTeam.score);
  const totalPoints = game.homeTeam.score + game.awayTeam.score;

  // "Serré, surtout à la fin" : on pondère l'écart final et l'écart du dernier quart-temps/prolongation,
  // avec un bonus pour un match où le score a beaucoup changé de main.
  const finalBucket = closenessBucket(diff);
  const lateBucket = closenessBucket(details.lastPeriodDiff || diff);
  const leadChangeBonus = Math.min(2, Math.floor(details.leadChanges / 6));
  const closeness = Math.min(10, Math.round(finalBucket * 0.4 + lateBucket * 0.5 + leadChangeBonus));

  const overtime = game.isOvertime ? 10 : 0;
  const intensity = intensityScore(totalPoints);
  const incident = incidentScoreFromDetails(details);

  const allStats = [...details.home, ...details.away];
  const playerScores: PlayerHypeScore[] = favoritePlayers.map((player) => {
    const stat = findPlayerStat(player, allStats);
    return {
      player,
      isPresent: !!stat,
      score: stat ? playerImpactScore(stat) : null,
      stat,
    };
  });

  const resolvedScores = playerScores
    .map((ps) => ps.score)
    .filter((s): s is number => s !== null);

  const total = computeTotal(closeness, overtime, intensity, incident, resolvedScores);
  const { verdict, verdictEmoji } = verdictFor(total);

  return {
    closenessScore: closeness,
    overtimeScore: overtime,
    intensityScore: intensity,
    incidentScore: incident,
    playerScores,
    total,
    verdict,
    verdictEmoji,
    summary: buildSummary(diff, totalPoints, game.isOvertime, playerScores, details),
    enriched: true,
  };
}
