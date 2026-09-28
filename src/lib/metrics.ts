export type VideoMetric = {
  title?: string;
  views?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  watchHours?: number | null;
  subscribers?: number | null;
};

const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

export function analyzeMetrics(videos: VideoMetric[]) {
  const rows = videos ?? [];
  const views = rows.reduce((s, v) => s + (finite(v.views) ? Math.max(v.views!, 0) : 0), 0);
  const impressions = rows.reduce((s, v) => s + (finite(v.impressions) ? Math.max(v.impressions!, 0) : 0), 0);
  const watchHours = rows.reduce((s, v) => s + (finite(v.watchHours) ? Math.max(v.watchHours!, 0) : 0), 0);
  const subscribers = rows.reduce((s, v) => s + (finite(v.subscribers) ? v.subscribers! : 0), 0);

  let numerator = 0;
  let denominator = 0;

  for (const v of rows) {
    if (finite(v.ctr) && finite(v.impressions) && v.impressions! > 0) {
      const ctr = Math.min(Math.max(v.ctr!, 0), 1);
      numerator += ctr * v.impressions!;
      denominator += v.impressions!;
    }
  }

  return {
    sampleSize: rows.length,
    totals: {
      views,
      impressions,
      watchHours,
      subscribers
    },
    rates: {
      weightedCtr: denominator > 0 ? numerator / denominator : null,
      subsPer1000Views: views > 0 ? (subscribers / views) * 1000 : null,
      watchHoursPer1000Views: views > 0 ? (watchHours / views) * 1000 : null
    },
    dataCoverage: {
      rowsWithCtr: rows.filter(v => finite(v.ctr) && finite(v.impressions) && v.impressions! > 0).length,
      rowsWithViews: rows.filter(v => finite(v.views)).length,
      rowsWithWatch: rows.filter(v => finite(v.watchHours)).length,
      rowsWithSubs: rows.filter(v => finite(v.subscribers)).length
    }
  };
}
