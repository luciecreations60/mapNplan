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

export function TripMap({ points, onMapClick = null, onPointSelect = null, selection = null, focusedPointId = null }) {
  const { language, t } = useI18n();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const markersRef = useRef([]);
  const selectionMarkerRef = useRef(null);
  const clickHandlerRef = useRef(onMapClick);
  const pointSelectHandlerRef = useRef(onPointSelect);
  const pointsRef = useRef(points || []);
  const languageRef = useRef(language);
  const tRef = useRef(t);
  const focusedPointIdRef = useRef(focusedPointId);
  const selectionRef = useRef(selection);
  const lastViewportSignatureRef = useRef('');
  const lastContainerWidthRef = useRef(0);

  pointsRef.current = points || [];
  languageRef.current = language;
  tRef.current = t;
  focusedPointIdRef.current = focusedPointId;
  selectionRef.current = selection;

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

  const selectionSignature = selection && Number.isFinite(selection.latitude) && Number.isFinite(selection.longitude)
    ? `${selection.latitude}|${selection.longitude}`
    : '';

  useEffect(() => { clickHandlerRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { pointSelectHandlerRef.current = onPointSelect; }, [onPointSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container,
      style: MAP_CONFIG.styleUrl,
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const handleClick = (event) => {
      if (!clickHandlerRef.current) return;
      clickHandlerRef.current({
        latitude: Number(event.lngLat.lat),
        longitude: Number(event.lngLat.lng),
      });
    };

    const handleLoad = () => {
      mapReadyRef.current = true;
      applyMapLanguage(map, languageRef.current);
      rebuildMarkers(map, pointsRef.current, markersRef, pointSelectHandlerRef, tRef);
      applyInitialViewport(map, pointsRef.current, viewportSignature, lastViewportSignatureRef);
      syncFocusedPoint(map, pointsRef.current, focusedPointIdRef.current, markersRef);
      syncSelection(map, selectionRef.current, selectionMarkerRef, tRef);
      window.requestAnimationFrame(() => map.resize());
    };

    map.on('click', handleClick);
    map.once('load', handleLoad);

    // Only width changes need a MapLibre resize here. The map has a stable CSS
    // height, so observing height as well can create a ResizeObserver/layout
    // feedback loop in Chrome when the card and canvas size each other.
    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect?.width || 0);
      if (!width || Math.abs(width - lastContainerWidthRef.current) < 2) return;
      lastContainerWidthRef.current = width;
      if (!mapReadyRef.current) return;
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => map.resize());
    });
    resizeObserver.observe(container);

    return () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      map.off('click', handleClick);
      map.off('load', handleLoad);
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      selectionMarkerRef.current?.remove();
      selectionMarkerRef.current = null;
      mapReadyRef.current = false;
      lastViewportSignatureRef.current = '';
      lastContainerWidthRef.current = 0;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || !map.isStyleLoaded()) return;
    applyMapLanguage(map, language);
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    rebuildMarkers(map, pointsRef.current, markersRef, pointSelectHandlerRef, tRef);
    syncFocusedPoint(map, pointsRef.current, focusedPointIdRef.current, markersRef);
  }, [markerSignature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || lastViewportSignatureRef.current === viewportSignature) return;
    applyInitialViewport(map, pointsRef.current, viewportSignature, lastViewportSignatureRef);
  }, [viewportSignature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    syncFocusedPoint(map, pointsRef.current, focusedPointId, markersRef, true);
  }, [focusedPointId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    syncSelection(map, selection, selectionMarkerRef, tRef, true);
  }, [selectionSignature]);

  return <div ref={containerRef} className="trip-map trip-map--stable" aria-label={t('map.aria')} />;
}

function rebuildMarkers(map, points, markersRef, pointSelectHandlerRef, tRef) {
  markersRef.current.forEach(({ marker }) => marker.remove());
  markersRef.current = [];

  (points || []).forEach((point, index) => {
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
}

function applyInitialViewport(map, points, signature, lastViewportSignatureRef) {
  lastViewportSignatureRef.current = signature;
  const validPoints = (points || []).filter((point) => (
    Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude))
  ));

  if (validPoints.length === 0) {
    map.jumpTo({ center: MAP_CONFIG.defaultCenter, zoom: MAP_CONFIG.defaultZoom });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  validPoints.forEach((point) => bounds.extend([Number(point.longitude), Number(point.latitude)]));
  if (validPoints.length === 1) {
    map.jumpTo({ center: bounds.getCenter(), zoom: MAP_CONFIG.focusedZoom });
    return;
  }
  map.fitBounds(bounds, { padding: 54, maxZoom: MAP_CONFIG.tripOverviewZoom, duration: 0 });
}

function syncFocusedPoint(map, points, focusedPointId, markersRef, move = false) {
  markersRef.current.forEach(({ id, element }) => {
    element.classList.toggle('maplibre-point-marker--focused', id === focusedPointId);
  });
  if (!focusedPointId || !move) return;

  const point = (points || []).find((candidate) => candidate.id === focusedPointId);
  if (!point) return;
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
  map.flyTo({
    center: [longitude, latitude],
    zoom: Math.max(map.getZoom(), MAP_CONFIG.focusedZoom),
    speed: 1.25,
    essential: true,
  });
}

function syncSelection(map, selection, selectionMarkerRef, tRef, move = false) {
  selectionMarkerRef.current?.remove();
  selectionMarkerRef.current = null;
  if (!selection) return;

  const latitude = Number(selection.latitude);
  const longitude = Number(selection.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  const coordinates = [longitude, latitude];
  const element = createMapMarkerElement({
    color: '#f4a62a',
    size: 24,
    label: tRef.current('map.selectedPoint'),
    number: '+',
  });
  element.classList.add('maplibre-point-marker--selected');
  selectionMarkerRef.current = new maplibregl.Marker({ element, anchor: 'bottom' })
    .setLngLat(coordinates)
    .addTo(map);

  if (move) {
    map.flyTo({
      center: coordinates,
      zoom: Math.max(map.getZoom(), MAP_CONFIG.focusedZoom),
      speed: 1.25,
      essential: true,
    });
  }
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
