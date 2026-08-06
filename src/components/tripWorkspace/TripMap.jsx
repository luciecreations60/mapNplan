import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useI18n } from '../../hooks/useI18n.js';
import { MAP_CONFIG } from '../../config/map.config.js';
import { applyMapLanguage, createMapMarkerElement } from '../../utils/mapLanguage.js';

const SOURCE_COLORS = Object.freeze({
  reservation: '#1aa181',
  destination: '#c96574',
  savedPlace: '#d89422',
  itinerary: '#1f90ad',
});

export function TripMap({ points, onMapClick = null, onPointSelect = null, selection = null }) {
  const { language, t } = useI18n();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const selectionMarkerRef = useRef(null);
  const clickHandlerRef = useRef(onMapClick);

  useEffect(() => {
    clickHandlerRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styleUrl,
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => applyMapLanguage(map, language));
    map.on('styledata', () => applyMapLanguage(map, language));
    map.on('click', (event) => {
      if (!clickHandlerRef.current) return;
      clickHandlerRef.current({
        latitude: Number(event.lngLat.lat),
        longitude: Number(event.lngLat.lng),
      });
    });

    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      selectionMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
      selectionMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateLanguage = () => applyMapLanguage(map, language);
    if (map.isStyleLoaded()) updateLanguage();
    else map.once('load', updateLanguage);
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (points.length === 0) {
      map.easeTo({ center: MAP_CONFIG.defaultCenter, zoom: MAP_CONFIG.defaultZoom, duration: 350 });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    points.forEach((point, index) => {
      const longitude = Number(point.longitude);
      const latitude = Number(point.latitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const coordinates = [longitude, latitude];
      bounds.extend(coordinates);
      const element = createMapMarkerElement({
        color: SOURCE_COLORS[point.source] || SOURCE_COLORS.itinerary,
        size: point.source === 'destination' ? 21 : 18,
        label: `${index + 1}. ${point.title}`,
      });
      element.dataset.pointId = point.id;
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        map.flyTo({ center: coordinates, zoom: MAP_CONFIG.focusedZoom, essential: true });
        onPointSelect?.(point);
      });

      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat(coordinates)
        .setPopup(new maplibregl.Popup({ offset: 18, closeButton: false }).setDOMContent(createPopupNode(point, t)))
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (bounds.isEmpty()) return;
    if (points.length === 1) {
      map.easeTo({ center: bounds.getCenter(), zoom: MAP_CONFIG.focusedZoom, duration: 450 });
    } else {
      map.fitBounds(bounds, { padding: 54, maxZoom: MAP_CONFIG.tripOverviewZoom, duration: 500 });
    }
  }, [onPointSelect, points, t]);

  useEffect(() => {
    const map = mapRef.current;
    selectionMarkerRef.current?.remove();
    selectionMarkerRef.current = null;
    if (!map || !selection || !Number.isFinite(selection.latitude) || !Number.isFinite(selection.longitude)) return;

    const coordinates = [selection.longitude, selection.latitude];
    const element = createMapMarkerElement({ color: '#f4a62a', size: 24, label: t('map.selectedPoint') });
    element.classList.add('maplibre-point-marker--selected');
    selectionMarkerRef.current = new maplibregl.Marker({ element, anchor: 'center' })
      .setLngLat(coordinates)
      .addTo(map);

    map.flyTo({
      center: coordinates,
      zoom: Math.max(map.getZoom(), MAP_CONFIG.focusedZoom),
      speed: 1.25,
      essential: true,
    });
  }, [selection, t]);

  return <div ref={containerRef} className="trip-map" aria-label={t('map.aria')} />;
}

function createPopupNode(point, t) {
  const wrapper = document.createElement('div');
  wrapper.className = 'trip-map-popup';
  const source = document.createElement('small');
  source.textContent = point.source === 'reservation'
    ? t('map.reservation')
    : point.source === 'destination'
      ? t('map.destination')
      : point.source === 'savedPlace'
        ? t('map.savedPlace')
        : t('map.itinerary');
  const title = document.createElement('strong');
  title.textContent = point.title;
  const subtitle = document.createElement('span');
  subtitle.textContent = point.subtitle || t('map.savedCoordinates');
  wrapper.append(source, title, subtitle);
  return wrapper;
}
