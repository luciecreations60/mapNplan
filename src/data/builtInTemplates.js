/**
 * Built-in template catalogue.
 *
 * The factory receives the translation function so every generated template
 * uses the currently selected interface language. User-created templates are
 * stored separately and keep the language in which they were authored.
 */
export function createBuiltInTripTemplates(t) {
  return [
    {
      id: 'builtin-city-break',
      builtIn: true,
      category: 'city',
      name: t('templates.builtIn.city.name'),
      description: t('templates.builtIn.city.description'),
      durationDays: 3,
      travelers: 2,
      budget: 900,
      currency: 'EUR',
      destinationCurrency: 'EUR',
      accent: 'violet',
      summary: t('templates.builtIn.city.summary'),
      itineraryDays: [
        {
          title: t('templates.builtIn.city.day1'),
          items: [
            item('14:00', 'hotel', t('templates.builtIn.shared.checkIn'), 60),
            item('16:00', 'map', t('templates.builtIn.city.neighbourhoodWalk'), 120),
            item('19:30', 'food', t('templates.builtIn.city.localDinner'), 90),
          ],
        },
        {
          title: t('templates.builtIn.city.day2'),
          items: [
            item('09:00', 'map', t('templates.builtIn.city.mainLandmark'), 120),
            item('12:30', 'food', t('templates.builtIn.city.marketLunch'), 75),
            item('15:00', 'ticket', t('templates.builtIn.city.museum'), 120),
            item('19:00', 'map', t('templates.builtIn.city.sunsetView'), 90),
          ],
        },
        {
          title: t('templates.builtIn.city.day3'),
          items: [
            item('09:30', 'food', t('templates.builtIn.city.brunch'), 75),
            item('11:30', 'map', t('templates.builtIn.city.localDistrict'), 150),
            item('16:00', 'plane', t('templates.builtIn.shared.departure'), 60),
          ],
        },
      ],
      checklist: buildChecklist(t, 'city'),
    },
    {
      id: 'builtin-road-trip',
      builtIn: true,
      category: 'road',
      name: t('templates.builtIn.road.name'),
      description: t('templates.builtIn.road.description'),
      durationDays: 5,
      travelers: 2,
      budget: 1500,
      currency: 'EUR',
      destinationCurrency: 'EUR',
      accent: 'aqua',
      summary: t('templates.builtIn.road.summary'),
      itineraryDays: Array.from({ length: 5 }, (_, index) => ({
        title: t('templates.builtIn.road.dayTitle', { count: index + 1 }),
        items: [
          item('08:30', 'car', t('templates.builtIn.road.vehicleCheck'), 30),
          item('09:00', 'car', t('templates.builtIn.road.scenicDrive'), 180),
          item('12:30', 'food', t('templates.builtIn.road.lunchStop'), 75),
          item('15:00', 'map', t('templates.builtIn.road.highlightStop'), 120),
          item('18:30', 'hotel', t('templates.builtIn.road.nightStop'), 60),
        ],
      })),
      checklist: buildChecklist(t, 'road'),
    },
    {
      id: 'builtin-beach',
      builtIn: true,
      category: 'beach',
      name: t('templates.builtIn.beach.name'),
      description: t('templates.builtIn.beach.description'),
      durationDays: 4,
      travelers: 2,
      budget: 1200,
      currency: 'EUR',
      destinationCurrency: 'EUR',
      accent: 'coral',
      summary: t('templates.builtIn.beach.summary'),
      itineraryDays: [
        day(t('templates.builtIn.beach.day1'), [
          item('15:00', 'hotel', t('templates.builtIn.shared.checkIn'), 60),
          item('17:00', 'map', t('templates.builtIn.beach.firstSwim'), 120),
        ]),
        day(t('templates.builtIn.beach.day2'), [
          item('09:00', 'map', t('templates.builtIn.beach.beachMorning'), 180),
          item('14:00', 'ticket', t('templates.builtIn.beach.waterActivity'), 120),
          item('19:30', 'food', t('templates.builtIn.beach.seafoodDinner'), 90),
        ]),
        day(t('templates.builtIn.beach.day3'), [
          item('10:00', 'map', t('templates.builtIn.beach.dayTrip'), 300),
          item('19:00', 'map', t('templates.builtIn.beach.sunset'), 90),
        ]),
        day(t('templates.builtIn.beach.day4'), [
          item('09:00', 'food', t('templates.builtIn.beach.slowBreakfast'), 75),
          item('12:00', 'plane', t('templates.builtIn.shared.departure'), 60),
        ]),
      ],
      checklist: buildChecklist(t, 'beach'),
    },
    {
      id: 'builtin-business',
      builtIn: true,
      category: 'business',
      name: t('templates.builtIn.business.name'),
      description: t('templates.builtIn.business.description'),
      durationDays: 3,
      travelers: 1,
      budget: 1100,
      currency: 'EUR',
      destinationCurrency: 'EUR',
      accent: 'violet',
      summary: t('templates.builtIn.business.summary'),
      itineraryDays: [
        day(t('templates.builtIn.business.day1'), [
          item('15:00', 'hotel', t('templates.builtIn.shared.checkIn'), 45),
          item('17:00', 'map', t('templates.builtIn.business.venueCheck'), 60),
        ]),
        day(t('templates.builtIn.business.day2'), [
          item('08:30', 'ticket', t('templates.builtIn.business.meetings'), 420),
          item('18:30', 'food', t('templates.builtIn.business.networkingDinner'), 120),
        ]),
        day(t('templates.builtIn.business.day3'), [
          item('09:00', 'ticket', t('templates.builtIn.business.followUp'), 180),
          item('14:00', 'plane', t('templates.builtIn.shared.departure'), 60),
        ]),
      ],
      checklist: buildChecklist(t, 'business'),
    },
  ];
}

export function createBuiltInDayTemplates(t) {
  return [
    {
      id: 'builtin-day-arrival',
      builtIn: true,
      category: 'arrival',
      name: t('templates.dayBuiltIn.arrival.name'),
      description: t('templates.dayBuiltIn.arrival.description'),
      items: [
        item('14:00', 'hotel', t('templates.builtIn.shared.checkIn'), 60),
        item('16:00', 'map', t('templates.dayBuiltIn.arrival.orientationWalk'), 90),
        item('19:30', 'food', t('templates.dayBuiltIn.arrival.easyDinner'), 90),
      ],
    },
    {
      id: 'builtin-day-culture',
      builtIn: true,
      category: 'culture',
      name: t('templates.dayBuiltIn.culture.name'),
      description: t('templates.dayBuiltIn.culture.description'),
      items: [
        item('09:00', 'map', t('templates.dayBuiltIn.culture.landmark'), 120),
        item('12:30', 'food', t('templates.dayBuiltIn.culture.lunch'), 75),
        item('14:30', 'ticket', t('templates.dayBuiltIn.culture.museum'), 150),
        item('18:00', 'map', t('templates.dayBuiltIn.culture.neighbourhood'), 90),
      ],
    },
    {
      id: 'builtin-day-relaxed',
      builtIn: true,
      category: 'relaxed',
      name: t('templates.dayBuiltIn.relaxed.name'),
      description: t('templates.dayBuiltIn.relaxed.description'),
      items: [
        item('10:00', 'food', t('templates.dayBuiltIn.relaxed.breakfast'), 90),
        item('12:00', 'map', t('templates.dayBuiltIn.relaxed.freeTime'), 180),
        item('17:00', 'map', t('templates.dayBuiltIn.relaxed.sunset'), 90),
      ],
    },
  ];
}

export function createChecklistPreset(t, type) {
  return buildChecklist(t, type);
}

function buildChecklist(t, type) {
  const shared = [
    checklist(t('templates.checklist.identity'), 'documents'),
    checklist(t('templates.checklist.payment'), 'money'),
    checklist(t('templates.checklist.insurance'), 'documents'),
    checklist(t('templates.checklist.chargers'), 'packing'),
  ];

  const specialised = {
    city: [
      checklist(t('templates.checklist.walkingShoes'), 'packing'),
      checklist(t('templates.checklist.cityPass'), 'bookings'),
    ],
    road: [
      checklist(t('templates.checklist.drivingLicence'), 'documents'),
      checklist(t('templates.checklist.vehicleDocuments'), 'documents'),
      checklist(t('templates.checklist.offlineMaps'), 'technology'),
      checklist(t('templates.checklist.emergencyKit'), 'packing'),
    ],
    beach: [
      checklist(t('templates.checklist.sunProtection'), 'packing'),
      checklist(t('templates.checklist.swimwear'), 'packing'),
      checklist(t('templates.checklist.waterproofBag'), 'packing'),
    ],
    business: [
      checklist(t('templates.checklist.workDocuments'), 'documents'),
      checklist(t('templates.checklist.presentation'), 'technology'),
      checklist(t('templates.checklist.businessOutfit'), 'packing'),
    ],
  };

  return [...shared, ...(specialised[type] || [])];
}

function item(time, type, title, durationMinutes) {
  return {
    time,
    type,
    title,
    location: '',
    latitude: null,
    longitude: null,
    durationMinutes,
    estimatedCost: 0,
    notes: '',
  };
}

function day(title, items) {
  return { title, items };
}

function checklist(label, category) {
  return { label, category, completed: false };
}
