import { useMemo } from 'react';
import { GameData } from './useGames';
import { Player } from '../data/players';
import { computeHypeQuick, enrichHype, HypeBreakdown } from '../utils/hype';
import { useGameDetails } from './useGameDetails';

// Score rapide immédiatement, puis affiné dès que le détail réel du match
// (boxscore, prolongation, incidents) est chargé — uniquement pour les matchs
// où un joueur favori joue, pour ne pas alourdir la liste avec des requêtes inutiles.
export function useHypeScore(game: GameData, favoritePlayers: Player[]): HypeBreakdown {
  const hasFavorite = favoritePlayers.some(
    (p) => p.team === game.homeTeam.teamTricode || p.team === game.awayTeam.teamTricode
  );
  const shouldFetch = hasFavorite && game.gameStatus === 3;
  const { details } = useGameDetails(shouldFetch ? game.gameId : null);

  return useMemo(() => {
    if (details) return enrichHype(game, favoritePlayers, details);
    return computeHypeQuick(game, favoritePlayers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameId, game.homeTeam.score, game.awayTeam.score, game.isOvertime, favoritePlayers, details]);
}
