/**
 * Affiliate and booking-discovery configuration.
 *
 * No provider is enabled by default. The application therefore never claims
 * a commission-bearing relationship until the future business has explicitly
 * configured and enabled a partner in Settings.
 */
export const AFFILIATE_CONFIG_SCHEMA_VERSION = 1;

export const AFFILIATE_CATEGORIES = Object.freeze([
  { id: 'hotels', labelKey: 'affiliate.categories.hotels', icon: 'hotel' },
  { id: 'flights', labelKey: 'affiliate.categories.flights', icon: 'plane' },
  { id: 'activities', labelKey: 'affiliate.categories.activities', icon: 'ticket' },
  { id: 'cars', labelKey: 'affiliate.categories.cars', icon: 'car' },
  { id: 'esim', labelKey: 'affiliate.categories.esim', icon: 'wifi' },
  { id: 'insurance', labelKey: 'affiliate.categories.insurance', icon: 'shield' },
]);

export const AFFILIATE_TEMPLATE_TOKENS = Object.freeze([
  'destination',
  'country',
  'startDate',
  'endDate',
  'travelers',
  'currency',
  'locale',
  'category',
]);

export const DEFAULT_AFFILIATE_PROVIDERS = Object.freeze([
  {
    id: 'booking',
    name: 'Booking.com',
    category: 'hotels',
    enabled: false,
    affiliateCapable: true,
    homepageUrl: 'https://www.booking.com/',
    searchUrlTemplate: '',
    affiliateParameter: '',
    affiliateValue: '',
  },
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    category: 'flights',
    enabled: false,
    affiliateCapable: true,
    homepageUrl: 'https://www.skyscanner.net/',
    searchUrlTemplate: '',
    affiliateParameter: '',
    affiliateValue: '',
  },
  {
    id: 'google-flights',
    name: 'Google Flights',
    category: 'flights',
    enabled: false,
    affiliateCapable: false,
    homepageUrl: 'https://www.google.com/travel/flights',
    searchUrlTemplate: '',
    affiliateParameter: '',
    affiliateValue: '',
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    category: 'activities',
    enabled: false,
    affiliateCapable: true,
    homepageUrl: 'https://www.getyourguide.com/',
    searchUrlTemplate: '',
    affiliateParameter: '',
    affiliateValue: '',
  },
  {
    id: 'discovercars',
    name: 'DiscoverCars',
    category: 'cars',
    enabled: false,
    affiliateCapable: true,
    homepageUrl: 'https://www.discovercars.com/',
    searchUrlTemplate: '',
    affiliateParameter: '',
    affiliateValue: '',
  },
  {
    id: 'airalo',
    name: 'Airalo',
    category: 'esim',
    enabled: false,
    affiliateCapable: true,
    homepageUrl: 'https://www.airalo.com/',
    searchUrlTemplate: '',
    affiliateParameter: '',
    affiliateValue: '',
  },
  {
    id: 'heymondo',
    name: 'Heymondo',
    category: 'insurance',
    enabled: false,
    affiliateCapable: true,
    homepageUrl: 'https://heymondo.com/',
    searchUrlTemplate: '',
    affiliateParameter: '',
    affiliateValue: '',
  },
]);
