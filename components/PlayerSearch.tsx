import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Player } from '../data/players';
import { COLORS } from '../constants/theme';

interface Props {
  allPlayers: Player[];
  loadingPlayers: boolean;
  favoritePlayers: Player[];
  onAdd: (player: Player) => void;
  onRemove: (playerId: string) => void;
}

export default function PlayerSearch({ allPlayers, loadingPlayers, favoritePlayers, onAdd, onRemove }: Props) {
  const [query, setQuery] = useState('');

  const suggestions = query.trim().length >= 2
    ? allPlayers.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) &&
          !favoritePlayers.some((fp) => fp.id === p.id)
      ).slice(0, 8)
    : [];

  function handleSelect(player: Player) {
    onAdd(player);
    setQuery('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>MES JOUEURS FAVORIS</Text>

      {/* Tags */}
      {favoritePlayers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScroll}
          contentContainerStyle={styles.tagsContent}
        >
          {favoritePlayers.map((player) => (
            <View key={player.id} style={styles.tag}>
              <Text style={styles.tagText}>{player.name}</Text>
              <TouchableOpacity
                onPress={() => onRemove(player.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Search input */}
      <View style={styles.inputWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={loadingPlayers ? 'Chargement des joueurs...' : 'Ajouter un joueur...'}
          placeholderTextColor={COLORS.textFaint}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions — visibles tant qu'il y a du texte, sans dépendre du focus */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((player, index) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.suggestionItem,
                index < suggestions.length - 1 && styles.suggestionBorder,
              ]}
              onPress={() => handleSelect(player)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionName}>{player.name}</Text>
              <View style={styles.suggestionMeta}>
                {player.isStar && <Text style={styles.starBadge}>⭐</Text>}
                <Text style={styles.suggestionTeam}>{player.team}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {suggestions.length === 0 && query.trim().length >= 2 && !loadingPlayers && (
        <View style={styles.suggestions}>
          <Text style={styles.noResults}>Aucun joueur trouvé pour « {query.trim()} »</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  tagsScroll: {
    marginBottom: 12,
  },
  tagsContent: {
    gap: 8,
    paddingRight: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 100,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    gap: 8,
  },
  tagText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tagRemove: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  clearBtn: {
    fontSize: 18,
    color: COLORS.textMuted,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  suggestions: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBadge: {
    fontSize: 11,
  },
  suggestionTeam: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  noResults: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
});
