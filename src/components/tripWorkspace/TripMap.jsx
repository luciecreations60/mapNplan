import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useI18n } from '../../hooks/useI18n.js';
import { MAP_CONFIG } from '../../config/map.config.js';
import { applyMapLanguage, createMapMarkerElement } from '../../utils/mapLanguage.js';

const TYPE_COLORS = Object.freeze({
  destination: '#c96574',
  map: '#1f90ad',
  food: '#d88924',
  hotel: '#7559c8',
  plane: '#4b83cf',
  car: '#2c8aa8',
  ferry: '#137f9d',
  ticket: '#2cbb6b',
  reservation: '#1aa181',
  savedPlace: '#d89422',
});

function whenMapLoaded(map, callback) {
  if (!map) return () => {};
  if (map.loaded()) {
    callback();
    return () => {};
  }
  map.once('load', callback);
  return () => map.off('load', callback);
}

export function TripMap({ points, onMapClick = null, onPointSelect = null, selection = null, focusedPointId = null }) {
  const { language, t } = useI18n();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const selectionMarkerRef = useRef(null);
  const clickHandlerRef = useRef(onMapClick);
  const pointSelectHandlerRef = useRef(onPointSelect);
  const pointsRef = useRef(points);
  const tRef = useRef(t);
  const lastViewportSignatureRef = useRef('');
  const lastContainerSizeRef = useRef({ width: 0, height: 0 });

  pointsRef.current = points;
  tRef.current = t;

  const markerSignature = useMemo(() => (points || []).map((point) => [
    point.id,
    point.latitude,
    point.longitude,
    point.title,
    point.subtitle,
    point.type,
    point.source,
    point.transportMode,
  ].join('|')).join('::'), [points]);

  const viewportSignature = useMemo(() => (points || []).map((point) => [
    point.id,
    point.latitude,
    point.longitude,
  ].join('|')).join('::'), [points]);

  useEffect(() => { clickHandlerRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { pointSelectHandlerRef.current = onPointSelect; }, [onPointSelect]);

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
    map.on('load', () => window.requestAnimationFrame(() => map.resize()));
    map.on('click', (event) => {
      if (!clickHandlerRef.current) return;
      clickHandlerRef.current({ latitude: Number(event.lngLat.lat), longitude: Number(event.lngLat.lng) });
    });

    mapRef.current = map;
    let resizeFrame = null;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      const previous = lastContainerSizeRef.current;
      if (Math.abs(previous.width - width) < 2 && Math.abs(previous.height - height) < 2) return;
      lastContainerSizeRef.current = { width, height };
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => map.resize());
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      markersRef.current.forEach(({ marker }) => marker.remove());
      selectionMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
      selectionMarkerRef.current = null;
      lastViewportSignatureRef.current = '';
      lastContainerSizeRef.current = { width: 0, height: 0 };
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    return whenMapLoaded(map, () => applyMapLanguage(map, language));
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    return whenMapLoaded(map, () => {
      const currentPoints = pointsRef.current || [];
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];

      currentPoints.forEach((point, index) => {
        const longitude = Number(point.longitude);
        const latitude = Number(point.latitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const coordinates = [longitude, latitude];
        const element = createMapMarkerElement({
          color: getPointColor(point),
          size: point.source === 'destination' ? 22 : 20,
          label: `${index + 1}. ${point.title}`,
          number: index + 1,
        });
        element.dataset.pointId = point.id;
        element.addEventListener('click', (event) => {
          event.stopPropagation();
          map.flyTo({ center: coordinates, zoom: MAP_CONFIG.focusedZoom, essential: true });
          pointSelectHandlerRef.current?.(point);
        });

        const marker = new maplibregl.Marker({ element, anchor: 'bottom' })
          .setLngLat(coordinates)
          .setPopup(new maplibregl.Popup({ offset: 18, closeButton: false }).setDOMContent(createPopupNode(point, tRef.current)))
          .addTo(map);
        markersRef.current.push({ id: point.id, marker, element });
      });
    });
  }, [markerSignature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lastViewportSignatureRef.current === viewportSignature) return undefined;

    return whenMapLoaded(map, () => {
      if (lastViewportSignatureRef.current === viewportSignature) return;
      lastViewportSignatureRef.current = viewportSignature;
      const currentPoints = pointsRef.current || [];

      if (currentPoints.length === 0) {
        map.jumpTo({ center: MAP_CONFIG.defaultCenter, zoom: MAP_CONFIG.defaultZoom });
        return;
      }

      const bounds = new maplibregl.LngLatBounds();
      currentPoints.forEach((point) => {
        const longitude = Number(point.longitude);
        const latitude = Number(point.latitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) bounds.extend([longitude, latitude]);
      });
      if (bounds.isEmpty()) return;
      if (currentPoints.length === 1) map.jumpTo({ center: bounds.getCenter(), zoom: MAP_CONFIG.focusedZoom });
      else map.fitBounds(bounds, { padding: 54, maxZoom: MAP_CONFIG.tripOverviewZoom, duration: 0 });
    });
  }, [viewportSignature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    return whenMapLoaded(map, () => {
      markersRef.current.forEach(({ id, element }) => element.classList.toggle('maplibre-point-marker--focused', id === focusedPointId));
      if (!focusedPointId) return;
      const point = (pointsRef.current || []).find((candidate) => candidate.id === focusedPointId);
      if (!point) return;
      const latitude = Number(point.latitude);
      const longitude = Number(point.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      map.flyTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), MAP_CONFIG.focusedZoom), speed: 1.25, essential: true });
    });
  }, [focusedPointId, viewportSignature]);

  const selectionSignature = selection && Number.isFinite(selection.latitude) && Number.isFinite(selection.longitude)
    ? `${selection.latitude}|${selection.longitude}`
    : '';

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    return whenMapLoaded(map, () => {
      selectionMarkerRef.current?.remove();
      selectionMarkerRef.current = null;
      if (!selectionSignature) return;

      const [latitude, longitude] = selectionSignature.split('|').map(Number);
      const coordinates = [longitude, latitude];
      const element = createMapMarkerElement({ color: '#f4a62a', size: 24, label: tRef.current('map.selectedPoint'), number: '+' });
      element.classList.add('maplibre-point-marker--selected');
      selectionMarkerRef.current = new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat(coordinates).addTo(map);
      map.flyTo({ center: coordinates, zoom: Math.max(map.getZoom(), MAP_CONFIG.focusedZoom), speed: 1.25, essential: true });
    });
  }, [selectionSignature]);

  return <div ref={containerRef} className="trip-map" aria-label={t('map.aria')} />;
}

function getPointColor(point) {
  if (point.source === 'destination') return TYPE_COLORS.destination;
  if (point.type === 'car' && point.transportMode === 'ferry') return TYPE_COLORS.ferry;
  if (TYPE_COLORS[point.type]) return TYPE_COLORS[point.type];
  if (point.source === 'reservation') return TYPE_COLORS.reservation;
  if (point.source === 'savedPlace') return TYPE_COLORS.savedPlace;
  return TYPE_COLORS.map;
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
