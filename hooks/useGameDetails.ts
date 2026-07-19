import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerStat {
  name: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgPct: string;  // ex: "50%" ou "—"
  fg3Pct: string; // ex: "33%" ou "—"
  plusMinus: number;
  teamTricode: string;
}

export interface GameDetails {
  home: PlayerStat[];
  away: PlayerStat[];
  leadChanges: number;
  lastPeriodDiff: number; // écart de score sur le dernier quart-temps/prolongation joué
  incidentCount: number;  // fautes techniques + flagrantes détectées
  hasEjection: boolean;
  hasFlagrant: boolean;
}

const CACHE_PREFIX = '@nba_hype_game_details_v1_';
const memoryCache = new Map<string, GameDetails>();
const inFlight = new Map<string, Promise<GameDetails | null>>();

function parsePct(raw: string): string {
  const parts = raw?.split('-');
  if (!parts || parts.length < 2) return '—';
  const made = parseInt(parts[0], 10);
  const att = parseInt(parts[1], 10);
  if (isNaN(made) || isNaN(att) || att === 0) return '—';
  return `${Math.round((made / att) * 100)}%`;
}

function parseBoxScore(json: any): { away: PlayerStat[]; home: PlayerStat[] } {
  const players: any[] = json?.boxscore?.players ?? [];
  const teams: PlayerStat[][] = [];

  for (const teamData of players) {
    const tricode = (teamData?.team?.abbreviation ?? '').toUpperCase();
    const stats0 = teamData?.statistics?.[0];
    if (!stats0) { teams.push([]); continue; }

    const names: string[] = (stats0.names ?? stats0.labels ?? stats0.keys ?? [])
      .map((k: string) => k.toUpperCase());

    const idx = (label: string) => names.indexOf(label);
    const ptsIdx = idx('PTS');
    const rebIdx = idx('REB');
    const astIdx = idx('AST');
    const stlIdx = idx('STL');
    const blkIdx = idx('BLK');
    const fgIdx  = idx('FG');
    const fg3Idx = idx('3PT');
    const pmIdx  = idx('+/-');

    const getInt = (stats: string[], i: number) =>
      i >= 0 ? parseInt(stats[i] ?? '0', 10) || 0 : 0;

    const athletes: PlayerStat[] = (stats0.athletes ?? [])
      .filter((a: any) => !a.didNotPlay && a.stats?.length)
      .map((a: any): PlayerStat => ({
        name: a.athlete?.displayName ?? '',
        pts:    getInt(a.stats, ptsIdx),
        reb:    getInt(a.stats, rebIdx),
        ast:    getInt(a.stats, astIdx),
        stl:    getInt(a.stats, stlIdx),
        blk:    getInt(a.stats, blkIdx),
        fgPct:  fgIdx  >= 0 ? parsePct(a.stats[fgIdx])  : '—',
        fg3Pct: fg3Idx >= 0 ? parsePct(a.stats[fg3Idx]) : '—',
        plusMinus: getInt(a.stats, pmIdx),
        teamTricode: tricode,
      }))
      .filter((a: PlayerStat) => a.name)
      .sort((a: PlayerStat, b: PlayerStat) => b.pts - a.pts);

    teams.push(athletes);
  }

  return { away: teams[0] ?? [], home: teams[1] ?? [] };
}

function findTeamStat(json: any, statName: string): number {
  const teams: any[] = json?.boxscore?.teams ?? [];
  for (const t of teams) {
    const stat = (t.statistics ?? []).find((s: any) => s.name === statName);
    if (stat?.displayValue) {
      const n = parseFloat(stat.displayValue);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

function computeLastPeriodDiff(json: any): number {
  const competitors: any[] = json?.header?.competitions?.[0]?.competitors ?? [];
  const scores = competitors
    .map((c) => c.linescores?.[c.linescores.length - 1]?.displayValue)
    .filter((v) => v !== undefined)
    .map((v: string) => parseFloat(v));
  if (scores.length < 2) return 0;
  return Math.abs(scores[0] - scores[1]);
}

function detectIncidents(json: any): { incidentCount: number; hasEjection: boolean; hasFlagrant: boolean } {
  const plays: any[] = json?.plays ?? [];
  let incidentCount = 0;
  let hasEjection = false;
  let hasFlagrant = false;

  for (const p of plays) {
    const text: string = (p?.text ?? '').toLowerCase();
    if (text.includes('technical foul') || text.includes('flagrant') || text.includes('ejected')) {
      incidentCount++;
      if (text.includes('ejected')) hasEjection = true;
      if (text.includes('flagrant')) hasFlagrant = true;
    }
  }

  return { incidentCount, hasEjection, hasFlagrant };
}

async function fetchGameDetails(gameId: string): Promise<GameDetails | null> {
  try {
    const cachedRaw = await AsyncStorage.getItem(CACHE_PREFIX + gameId);
    if (cachedRaw) {
      const parsed: GameDetails = JSON.parse(cachedRaw);
      memoryCache.set(gameId, parsed);
      return parsed;
    }
  } catch {}

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`,
      { signal: controller.signal },
    ).finally(() => clearTimeout(tid));

    if (!res.ok) return null;
    const json = await res.json();

    const { home, away } = parseBoxScore(json);
    const { incidentCount, hasEjection, hasFlagrant } = detectIncidents(json);

    const details: GameDetails = {
      home,
      away,
      leadChanges: findTeamStat(json, 'leadChanges'),
      lastPeriodDiff: computeLastPeriodDiff(json),
      incidentCount,
      hasEjection,
      hasFlagrant,
    };

    memoryCache.set(gameId, details);
    // Un match terminé ne change plus jamais : cache indéfini.
    AsyncStorage.setItem(CACHE_PREFIX + gameId, JSON.stringify(details)).catch(() => {});
    return details;
  } catch {
    return null;
  }
}

function getGameDetails(gameId: string): Promise<GameDetails | null> {
  if (memoryCache.has(gameId)) return Promise.resolve(memoryCache.get(gameId)!);
  if (inFlight.has(gameId)) return inFlight.get(gameId)!;

  const promise = fetchGameDetails(gameId).finally(() => inFlight.delete(gameId));
  inFlight.set(gameId, promise);
  return promise;
}

export function useGameDetails(gameId: string | null) {
  const [details, setDetails] = useState<GameDetails | null>(gameId ? memoryCache.get(gameId) ?? null : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId) {
      setDetails(null);
      return;
    }
    if (memoryCache.has(gameId)) {
      setDetails(memoryCache.get(gameId)!);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getGameDetails(gameId).then((d) => {
      if (!cancelled) {
        setDetails(d);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [gameId]);

  return { details, loading };
}
