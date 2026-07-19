import { Player } from '../data/players';
import { PlayerStat } from '../hooks/useGameDetails';

// Normalise : minuscules, sans accents, apostrophes uniformisées
function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`’]/g, "'")
    .trim();
}

// Retrouve la ligne de stats d'un joueur favori dans un boxscore ESPN.
// Match par nom complet, puis par nom de famille + équipe (couvre les abréviations ESPN).
export function findPlayerStat(player: Player, stats: PlayerStat[]): PlayerStat | undefined {
  const norm = normName(player.name);
  const exact = stats.find((s) => normName(s.name) === norm);
  if (exact) return exact;

  const lastName = norm.split(' ').slice(1).join(' ');
  if (lastName.length > 2) {
    return stats.find((s) => {
      const sNorm = normName(s.name);
      return sNorm.split(' ').slice(1).join(' ') === lastName && s.teamTricode === player.team;
    });
  }
  return undefined;
}
