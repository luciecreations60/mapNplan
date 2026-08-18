import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useI18n } from '../../hooks/useI18n.js';
import { MAP_CONFIG } from '../../config/map.config.js';
import { applyMapLanguage } from '../../utils/mapLanguage.js';

const SOURCE_ID = 'mapnplan-points';
const PIN_LAYER_ID = 'mapnplan-point-pins';
const NUMBER_LAYER_ID = 'mapnplan-point-numbers';
const PIN_IMAGE_PREFIX = 'mapnplan-pin-';

const TYPE_COLORS = Object.freeze({
  destination: '#c96574',
  map: '#1f90ad',
  food: '#d88924',
  hotel: '#7559c8',
  plane: '#4b83cf',
  car: '#2c8aa8',
  ferry: '#137f9d',
  ticket: '#2cbb6b',
  savedPlace: '#d89422',
  selection: '#f4a62a',
});

export function TripMap({ points, onMapClick = null, onPointSelect = null, selection = null, focusedPointId = null }) {
  const { language, t } = useI18n();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const clickHandlerRef = useRef(onMapClick);
  const pointSelectHandlerRef = useRef(onPointSelect);
  const pointsRef = useRef(points || []);
  const selectionRef = useRef(selection);
  const focusedPointIdRef = useRef(focusedPointId);
  const languageRef = useRef(language);
  const lastViewportSignatureRef = useRef('');
  const lastContainerWidthRef = useRef(0);

  pointsRef.current = points || [];
  selectionRef.current = selection;
  focusedPointIdRef.current = focusedPointId;
  languageRef.current = language;

  const viewportSignature = useMemo(() => (points || []).map((point) => [
    point.id,
    point.latitude,
    point.longitude,
  ].join('|')).join('::'), [points]);

  const dataSignature = useMemo(() => {
    const pointPart = (points || []).map((point) => [
      point.id,
      point.latitude,
      point.longitude,
      point.title,
      point.subtitle,
      point.type,
      point.source,
      point.transportMode,
    ].join('|')).join('::');
    const selectionPart = selection && Number.isFinite(Number(selection.latitude)) && Number.isFinite(Number(selection.longitude))
      ? `${selection.latitude}|${selection.longitude}`
      : '';
    return `${pointPart}##${selectionPart}##${focusedPointId || ''}`;
  }, [points, selection, focusedPointId]);

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

    const handleMapClick = (event) => {
      const renderedPoints = map.queryRenderedFeatures(event.point, { layers: [PIN_LAYER_ID] });
      const feature = renderedPoints[0];
      if (feature && feature.properties?.pointId && feature.properties.pointId !== '__selection__') {
        const point = pointsRef.current.find((candidate) => candidate.id === feature.properties.pointId);
        if (point) {
          const latitude = Number(point.latitude);
          const longitude = Number(point.longitude);
          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            map.flyTo({ center: [longitude, latitude], zoom: MAP_CONFIG.focusedZoom, essential: true });
          }
          pointSelectHandlerRef.current?.(point);
          return;
        }
      }

      clickHandlerRef.current?.({
        latitude: Number(event.lngLat.lat),
        longitude: Number(event.lngLat.lng),
      });
    };

    const handleMouseMove = (event) => {
      const overPoint = map.queryRenderedFeatures(event.point, { layers: [PIN_LAYER_ID] }).length > 0;
      map.getCanvas().style.cursor = overPoint ? 'pointer' : (clickHandlerRef.current ? 'crosshair' : '');
    };

    const handleLoad = () => {
      mapReadyRef.current = true;
      applyMapLanguage(map, languageRef.current);
      ensurePointLayers(map);
      syncPointData(map, pointsRef.current, selectionRef.current, focusedPointIdRef.current);
      applyInitialViewport(map, pointsRef.current, viewportSignature, lastViewportSignatureRef);
      window.requestAnimationFrame(() => map.resize());
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    map.once('load', handleLoad);

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
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.off('load', handleLoad);
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
    ensurePointLayers(map);
    syncPointData(map, pointsRef.current, selectionRef.current, focusedPointIdRef.current);
  }, [dataSignature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || lastViewportSignatureRef.current === viewportSignature) return;
    applyInitialViewport(map, pointsRef.current, viewportSignature, lastViewportSignatureRef);
  }, [viewportSignature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || !focusedPointId) return;
    const point = pointsRef.current.find((candidate) => candidate.id === focusedPointId);
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
  }, [focusedPointId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || !selection) return;
    const latitude = Number(selection.latitude);
    const longitude = Number(selection.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    map.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), MAP_CONFIG.focusedZoom),
      speed: 1.25,
      essential: true,
    });
  }, [selection?.latitude, selection?.longitude]);

  return <div ref={containerRef} className="trip-map trip-map--stable" aria-label={t('map.aria')} />;
}

function ensurePointLayers(map) {
  ensurePinImages(map);

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: emptyFeatureCollection(),
    });
  }

  if (!map.getLayer(PIN_LAYER_ID)) {
    map.addLayer({
      id: PIN_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-anchor': 'bottom',
        'icon-size': [
          'case',
          ['==', ['get', 'selected'], true], 1.12,
          ['==', ['get', 'focused'], true], 1.1,
          1,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });
  }

  if (!map.getLayer(NUMBER_LAYER_ID)) {
    map.addLayer({
      id: NUMBER_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'text-field': ['get', 'number'],
        'text-size': 10,
        'text-font': ['Noto Sans Regular'],
        'text-offset': [0, -2.25],
        'text-anchor': 'center',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.16)',
        'text-halo-width': 0.45,
      },
    });
  }
}

function ensurePinImages(map) {
  Object.entries(TYPE_COLORS).forEach(([key, color]) => {
    const imageId = `${PIN_IMAGE_PREFIX}${key}`;
    if (map.hasImage(imageId)) return;
    map.addImage(imageId, createPinImage(color), { pixelRatio: 2 });
  });
}

function createPinImage(color) {
  const width = 64;
  const height = 80;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.moveTo(32, 76);
  context.bezierCurveTo(27, 67, 8, 48, 8, 28);
  context.bezierCurveTo(8, 14, 18, 5, 32, 5);
  context.bezierCurveTo(46, 5, 56, 14, 56, 28);
  context.bezierCurveTo(56, 48, 37, 67, 32, 76);
  context.closePath();
  context.fillStyle = color;
  context.fill();
  context.lineWidth = 5;
  context.strokeStyle = '#ffffff';
  context.stroke();

  return context.getImageData(0, 0, width, height);
}

function syncPointData(map, points, selection, focusedPointId) {
  const source = map.getSource(SOURCE_ID);
  if (!source?.setData) return;

  const features = (points || [])
    .map((point, index) => pointToFeature(point, index + 1, point.id === focusedPointId))
    .filter(Boolean);

  if (selection && Number.isFinite(Number(selection.latitude)) && Number.isFinite(Number(selection.longitude))) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(selection.longitude), Number(selection.latitude)],
      },
      properties: {
        pointId: '__selection__',
        source: 'selection',
        icon: `${PIN_IMAGE_PREFIX}selection`,
        number: '+',
        focused: false,
        selected: true,
      },
    });
  }

  source.setData({ type: 'FeatureCollection', features });
}

function pointToFeature(point, number, focused) {
  const longitude = Number(point.longitude);
  const latitude = Number(point.latitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    properties: {
      pointId: point.id,
      title: point.title || '',
      subtitle: point.subtitle || '',
      source: point.source || 'itinerary',
      icon: `${PIN_IMAGE_PREFIX}${getPointIconKey(point)}`,
      number: String(number),
      focused: Boolean(focused),
      selected: false,
    },
  };
}

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
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

function getPointIconKey(point) {
  if (point.source === 'destination') return 'destination';
  if (point.type === 'car' && point.transportMode === 'ferry') return 'ferry';
  if (Object.hasOwn(TYPE_COLORS, point.type)) return point.type;
  if (point.source === 'savedPlace') return 'savedPlace';
  return 'map';
}
