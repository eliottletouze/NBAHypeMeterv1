import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { GameData } from '../hooks/useGames';
import { Player } from '../data/players';
import { useGameDetails, PlayerStat } from '../hooks/useGameDetails';
import { findPlayerStat } from '../utils/matchPlayer';
import { getTeamLogo } from '../data/teams';
import { COLORS } from '../constants/theme';

interface Props {
  visible: boolean;
  game: GameData;
  favoritePlayers: Player[];
  onClose: () => void;
}

function Pill({ value, label, highlight = false }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <View style={sr.pill}>
      <Text style={[sr.pillVal, highlight && sr.pillHighlight]}>{value}</Text>
      <Text style={sr.pillLabel}>{label}</Text>
    </View>
  );
}

function StatRow({ stat, isFav = false }: { stat: PlayerStat; isFav?: boolean }) {
  return (
    <View style={sr.card}>
      {/* Nom + équipe */}
      <View style={sr.nameRow}>
        <Text style={[sr.name, isFav && sr.favName]} numberOfLines={1}>
          {isFav ? '⭐ ' : ''}{stat.name}
        </Text>
        {stat.teamTricode ? <Text style={sr.teamBadge}>{stat.teamTricode}</Text> : null}
      </View>
      {/* Ligne 1 : PTS REB AST STL BLK */}
      <View style={sr.pillRow}>
        <Pill value={stat.pts} label="PTS" highlight={isFav} />
        <Pill value={stat.reb} label="REB" />
        <Pill value={stat.ast} label="AST" />
        <Pill value={stat.stl} label="STL" />
        <Pill value={stat.blk} label="BLK" />
      </View>
      {/* Ligne 2 : FG% 3P% +/- */}
      <View style={sr.pillRow}>
        <Pill value={stat.fgPct} label="FG%" />
        <Pill value={stat.fg3Pct} label="3P%" />
        <Pill value={stat.plusMinus > 0 ? `+${stat.plusMinus}` : stat.plusMinus} label="+/-" />
      </View>
    </View>
  );
}

export default function ResultModal({ visible, game, favoritePlayers, onClose }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const { details, loading } = useGameDetails(confirmed ? game.gameId : null);
  const homeStats = details?.home ?? [];
  const awayStats = details?.away ?? [];

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  const homeWins = game.homeTeam.score > game.awayTeam.score;
  const top2Away = awayStats.slice(0, 2);
  const top2Home = homeStats.slice(0, 2);

  const favStats = favoritePlayers
    .map((p) => findPlayerStat(p, [...homeStats, ...awayStats]))
    .filter((s): s is PlayerStat => !!s);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {!confirmed ? (
            <View style={styles.confirmWrap}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningTitle}>ATTENTION SPOIL</Text>
              <Text style={styles.warningBody}>
                Tu vas voir le score et les stats de ce match.{'\n'}Tu es sûr de vouloir te spoiler ?
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Non, annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => setConfirmed(true)}>
                  <Text style={styles.confirmText}>Oui, spoile-moi</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsContent}>
              {/* Score */}
              <View style={styles.scoreRow}>
                <View style={styles.scoreTeam}>
                  <Image
                    source={{ uri: game.awayTeam.logo ?? getTeamLogo(game.awayTeam.teamTricode) }}
                    style={styles.scoreLogo}
                    resizeMode="contain"
                  />
                  <Text style={[styles.scoreNum, !homeWins && styles.winnerNum]}>
                    {game.awayTeam.score}
                  </Text>
                  <Text style={styles.scoreTricode}>{game.awayTeam.teamTricode}</Text>
                  {!homeWins && <Text style={styles.winBadge}>VAINQUEUR</Text>}
                </View>

                <Text style={styles.scoreDash}>—</Text>

                <View style={styles.scoreTeam}>
                  <Image
                    source={{ uri: game.homeTeam.logo ?? getTeamLogo(game.homeTeam.teamTricode) }}
                    style={styles.scoreLogo}
                    resizeMode="contain"
                  />
                  <Text style={[styles.scoreNum, homeWins && styles.winnerNum]}>
                    {game.homeTeam.score}
                  </Text>
                  <Text style={styles.scoreTricode}>{game.homeTeam.teamTricode}</Text>
                  {homeWins && <Text style={styles.winBadge}>VAINQUEUR</Text>}
                </View>
              </View>

              {loading ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 24 }} />
              ) : (
                <>

                  {favStats.length > 0 && (
                    <View style={styles.statsSection}>
                      <Text style={styles.sectionTitle}>
                        TES JOUEURS ({favStats.length})
                      </Text>
                      {favStats.map((s) => (
                        <StatRow key={s.name} stat={s} isFav />
                      ))}
                    </View>
                  )}

                  {(top2Away.length > 0 || top2Home.length > 0) && (
                    <View style={styles.statsSection}>
                      <Text style={styles.sectionTitle}>MEILLEURES PERFS</Text>
                      {[...top2Away, ...top2Home].map((s, i) => (
                        <StatRow key={i} stat={s} />
                      ))}
                    </View>
                  )}

                  {!loading && top2Away.length === 0 && top2Home.length === 0 && (
                    <Text style={styles.noStats}>Stats non disponibles</Text>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxHeight: '85%',
    padding: 20,
  },
  // Confirmation
  confirmWrap: { alignItems: 'center', gap: 14 },
  warningIcon: { fontSize: 44 },
  warningTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    color: COLORS.warning,
    letterSpacing: 2,
  },
  warningBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 21,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4, width: '100%' },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: COLORS.textMuted },
  confirmBtn: {
    flex: 1.6,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  // Results
  resultsContent: { gap: 0 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreTeam: { alignItems: 'center', flex: 1, gap: 2 },
  scoreLogo: { width: 60, height: 60, marginBottom: 4 },
  scoreNum: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    color: COLORS.borderStrong,
    lineHeight: 50,
  },
  winnerNum: { color: COLORS.textPrimary },
  scoreTricode: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  winBadge: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 10,
    color: COLORS.accent,
    letterSpacing: 1,
    marginTop: 2,
  },
  scoreDash: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: COLORS.borderStrong,
    marginHorizontal: 4,
  },
  // Stats
  statsSection: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  noStats: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textFaint,
    textAlign: 'center',
    marginVertical: 16,
  },
  closeBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeBtnText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: COLORS.textMuted },
});

const sr = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textDim,
    flex: 1,
  },
  favName: { color: COLORS.textSecondary, fontWeight: '600' },
  teamBadge: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 11,
    color: COLORS.textFaint,
    letterSpacing: 1,
  },
  pillRow: { flexDirection: 'row', gap: 6 },
  pill: { alignItems: 'center', minWidth: 40, flex: 1 },
  pillVal: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  pillHighlight: { color: COLORS.accent },
  pillLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 8,
    color: COLORS.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
