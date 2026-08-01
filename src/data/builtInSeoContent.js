import { createId } from '../utils/id.js';

/**
 * Creates a neutral starter article used to demonstrate the editorial flow.
 * It intentionally avoids time-sensitive claims and remains a draft until the
 * owner reviews and publishes it.
 */
export function createBuiltInSeoArticles() {
  const now = new Date().toISOString();
  return [
    {
      id: createId('seo-article'),
      slug: 'three-days-in-paris',
      language: 'en',
      status: 'draft',
      title: 'Three days in Paris: a practical first-time itinerary',
      metaTitle: '3 Days in Paris: Practical Itinerary and Planning Guide',
      metaDescription: 'Plan three balanced days in Paris with a flexible itinerary, neighbourhood ideas, travel tips and useful booking checkpoints.',
      destination: 'Paris',
      country: 'France',
      primaryKeyword: '3 days in Paris',
      secondaryKeywords: ['Paris itinerary', 'Paris travel planner', 'weekend in Paris'],
      heroImageUrl: '',
      heroAlt: 'Paris travel itinerary overview',
      excerpt: 'A calm, flexible framework for organising a first visit without trying to fit the whole city into one weekend.',
      introduction: 'A useful city itinerary should leave enough structure to avoid wasted time while keeping room for weather, queues and spontaneous discoveries. This example divides Paris into coherent areas so each day remains manageable.',
      itineraryBody: 'Day 1: settle in and explore the historic centre.\n\nDay 2: group museums, gardens and nearby neighbourhoods.\n\nDay 3: choose a slower local area, a market or a final viewpoint before departure.',
      practicalTips: 'Confirm opening days before fixing the schedule. Keep one flexible block each day. Save accommodation, transport and ticket references in the same trip workspace.',
      faq: [
        { id: createId('faq'), question: 'Is three days enough for a first visit?', answer: 'Three days can provide a useful introduction when activities are grouped by area and the itinerary stays realistic.' },
        { id: createId('faq'), question: 'Should every attraction be booked in advance?', answer: 'Only book the time-sensitive priorities. Keeping some free periods makes the itinerary more resilient.' },
      ],
      affiliateCategories: ['hotels', 'activities'],
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    },
  ];
}
