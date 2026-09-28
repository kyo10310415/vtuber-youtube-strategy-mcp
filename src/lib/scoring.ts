export type ChannelProfile = {
  competitiveAffinity?: number;
  storyAffinity?: number;
  noveltyAffinity?: number;
  longStreamAffinity?: number;
};

export type GameCandidate = {
  title: string;
  channelFit: number;
  marketDemand: number;
  continuity: number;
  competitionLevel: number;
  rankedMode?: boolean;
  notes?: string;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function scoreGames(profile: ChannelProfile, games: GameCandidate[]) {
  const competitive = clamp01(profile.competitiveAffinity ?? 0.5);

  return games
    .map((g) => {
      const channelFit = clamp01(g.channelFit);
      const marketDemand = clamp01(g.marketDemand);
      const continuity = clamp01(g.continuity);
      const competitionLevel = clamp01(g.competitionLevel);
      const rankedBonus = g.rankedMode ? competitive * 0.05 : 0;

      const score = clamp01(
        channelFit * 0.40 +
        marketDemand * 0.30 +
        continuity * 0.20 -
        competitionLevel * 0.10 +
        rankedBonus
      );

      return {
        title: g.title,
        score,
        components: {
          channelFit,
          marketDemand,
          continuity,
          competitionLevel,
          rankedBonus
        },
        notes: g.notes ?? null
      };
    })
    .sort((a, b) => b.score - a.score);
}
