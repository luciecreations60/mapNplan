const CATEGORY_BY_ACTIVITY_TYPE = Object.freeze({
  car: 'transport',
  plane: 'transport',
  hotel: 'accommodation',
  food: 'food',
  ticket: 'activities',
  map: 'activities',
});

/**
 * Convert itinerary items that already have an estimated cost into stable
 * expense candidates. Multi-day stays appear only once because their cost is
 * carried by the first occurrence of the activity series.
 */
export function getBudgetedItineraryActivities(trip) {
  const candidates = [];
  const seenSeries = new Set();

  for (const day of trip?.itinerary || []) {
    for (const item of day.items || []) {
      const amount = Math.max(0, Number(item.estimatedCost) || 0);
      if (amount <= 0) continue;
      if (item.seriesId) {
        if (seenSeries.has(item.seriesId)) continue;
        seenSeries.add(item.seriesId);
      }
      candidates.push({
        activityId: item.id,
        seriesId: item.seriesId || null,
        title: item.title || 'Activity',
        amount,
        date: item.stayStartDate || day.date || '',
        category: CATEGORY_BY_ACTIVITY_TYPE[item.type] || 'other',
        type: item.type || 'map',
        location: item.location || '',
      });
    }
  }

  return candidates.sort((left, right) => `${left.date}-${left.title}`.localeCompare(`${right.date}-${right.title}`));
}

export function getUnlinkedBudgetedActivities(trip) {
  const linkedActivityIds = new Set();
  const linkedSeriesIds = new Set();
  for (const expense of trip?.expenses || []) {
    if (expense.sourceActivityId) linkedActivityIds.add(String(expense.sourceActivityId));
    if (expense.sourceActivitySeriesId) linkedSeriesIds.add(String(expense.sourceActivitySeriesId));
  }

  return getBudgetedItineraryActivities(trip).filter((candidate) => (
    !linkedActivityIds.has(String(candidate.activityId))
    && (!candidate.seriesId || !linkedSeriesIds.has(String(candidate.seriesId)))
  ));
}

export function findBudgetedActivity(trip, activityId) {
  return getBudgetedItineraryActivities(trip).find((candidate) => candidate.activityId === activityId) || null;
}
