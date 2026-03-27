# NBA Hype Meter

Application mobile React Native pour savoir si un match NBA vaut le coup d'être regardé en replay — sans spoilers.

## Fonctionnalité principale

Un score de **Hype (0-10)** est calculé pour chaque match terminé, basé sur :

- **Serré** — écart final entre les deux équipes
- **Intensité** — total de points inscrits
- **Suspense** — probabilité de prolongation (écart ≤ 4 pts)
- **Joueurs favoris** — pondération si un de tes joueurs a joué ce match

| Score | Verdict |
|-------|---------|
| 8-10 | 🔥 À voir absolument |
| 6-7 | 👍 Vaut le détour |
| 4-5 | 🤔 Peut-être |
| 0-3 | 💤 Passe ton tour |

## Fonctionnalités

- **Navigation par date** — consulte les matchs jusqu'à 14 jours en arrière et 7 jours à venir (swipe ou boutons)
- **Joueurs favoris** — recherche et ajoute tes joueurs préférés pour personnaliser le score de hype
- **Résultats sans spoil** — un écran de confirmation avant d'afficher le score et les stats
- **Stats joueurs** — PTS, REB, AST, STL, BLK, FG%, 3P% via ESPN
- **Notifications push** — alerte quand un match a un hype ≥ 8, ou quand un de tes joueurs a joué hier
- **Mode hors-ligne** — données de démonstration si l'API est inaccessible

## Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| Framework | React Native 0.83 + Expo SDK 55 |
| Navigation | Expo Router (file-based) |
| Animations | React Native Reanimated v4 |
| Gestes | React Native Gesture Handler v2 |
| Graphiques | React Native SVG |
| Stockage | AsyncStorage |
| Données | ESPN API (gratuite, sans clé) |
| Polices | Bebas Neue + DM Sans |

## Structure du projet

```
NBAHypeMeter/
├── app/
│   ├── _layout.tsx        # Layout racine + configuration des onglets
│   └── index.tsx          # Écran principal Hype Meter
├── components/
│   ├── GameCard.tsx        # Carte d'un match avec score hype animé
│   ├── ResultModal.tsx     # Modal résultat avec anti-spoil + stats
│   ├── HypeModal.tsx       # Bottom sheet détail hype
│   ├── HypeRing.tsx        # Anneau de score animé (SVG)
│   ├── AnimatedBar.tsx     # Barre de progression animée
│   └── PlayerSearch.tsx    # Recherche et gestion des joueurs favoris
├── hooks/
│   ├── useGames.ts         # Fetch des matchs NBA (ESPN + fallbacks NBA)
│   ├── usePlayers.ts       # Gestion des joueurs favoris (AsyncStorage)
│   ├── useNBAPlayers.ts    # Liste complète des joueurs NBA (NBA Stats + ESPN)
│   ├── useGameStats.ts     # Stats box score via ESPN
│   ├── useNotifications.ts # Notifications push
│   └── useYesterdayGames.ts# Matchs d'hier
├── utils/
│   └── hype.ts             # Algorithme de calcul du score hype
├── data/
│   ├── players.ts          # Interface Player + liste des stars
│   └── teams.ts            # 30 équipes NBA + logos ESPN
└── config/
    └── apiKeys.ts          # Clé API optionnelle (BallDontLie)
```

## Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npx expo start

# iOS
npx expo start --ios

# Android
npx expo start --android
```

## Sources de données

L'app utilise uniquement des APIs publiques, sans clé requise pour le fonctionnement de base :

- **ESPN Scoreboard** — matchs, scores, logos équipes (`site.api.espn.com`)
- **ESPN Summary** — stats box score par match
- **NBA CDN / data.nba.net** — données de secours si ESPN est indisponible
- **NBA Stats API** — liste des joueurs actifs de la saison en cours
- **BallDontLie** — optionnel, nécessite une clé dans `config/apiKeys.ts`

## Données hors-ligne

Si toutes les sources API échouent, l'app affiche automatiquement 5 matchs de démonstration avec un bandeau d'avertissement `⚠️ Données hors-ligne`.
