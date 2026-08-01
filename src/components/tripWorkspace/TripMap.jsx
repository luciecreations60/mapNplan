import { useEffect, useRef } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../config/map.config.js';

export function TripMap({ points, onMapClick = null, selection = null }) {
  const { t } = useI18n();
  const containerRef = useRef(null); const mapRef = useRef(null); const layerGroupRef = useRef(null); const selectionLayerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, { center: MAP_CONFIG.defaultCenter, zoom: MAP_CONFIG.defaultZoom, zoomControl: true });
    L.tileLayer(MAP_CONFIG.tileUrl, { ...MAP_CONFIG.tileOptions, attribution: MAP_CONFIG.attribution }).addTo(map);
    mapRef.current = map; layerGroupRef.current = L.layerGroup().addTo(map); selectionLayerRef.current = L.layerGroup().addTo(map);
    const resizeObserver = new ResizeObserver(() => map.invalidateSize()); resizeObserver.observe(containerRef.current);
    return () => { resizeObserver.disconnect(); map.remove(); mapRef.current = null; layerGroupRef.current = null; selectionLayerRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current; if (!map || !onMapClick) return undefined;
    const handleClick = (event) => onMapClick({ latitude: Number(event.latlng.lat), longitude: Number(event.latlng.lng) });
    map.on('click', handleClick); map.getContainer().classList.add('trip-map--selectable');
    return () => { map.off('click', handleClick); map.getContainer().classList.remove('trip-map--selectable'); };
  }, [onMapClick]);
  useEffect(() => {
    const map = mapRef.current; const layerGroup = layerGroupRef.current; if (!map || !layerGroup) return;
    layerGroup.clearLayers(); if (points.length === 0) { map.setView(MAP_CONFIG.defaultCenter, MAP_CONFIG.defaultZoom); return; }
    const bounds = []; const itineraryCoordinates = [];
    points.forEach((point, index) => {
      const coordinates = [point.latitude, point.longitude]; bounds.push(coordinates); if (point.source === 'itinerary') itineraryCoordinates.push(coordinates);
      const marker = L.circleMarker(coordinates, { radius: 8, weight: 3, color: point.source === 'reservation' ? '#1aa181' : point.source === 'destination' ? '#c96574' : point.source === 'savedPlace' ? '#a46a15' : '#5b5ce2', fillColor: point.source === 'reservation' ? '#29bea0' : point.source === 'destination' ? '#f08b78' : point.source === 'savedPlace' ? '#e0a33b' : '#7475ff', fillOpacity: .92 });
      marker.bindTooltip(String(index + 1), { permanent: true, direction: 'center', className: 'trip-map__sequence' }); marker.bindPopup(createPopupNode(point, t)); marker.addTo(layerGroup);
    });
    if (itineraryCoordinates.length > 1) L.polyline(itineraryCoordinates, { color: '#5b5ce2', weight: 3, opacity: .65, dashArray: '8 9' }).addTo(layerGroup);
    if (bounds.length === 1) map.setView(bounds[0], MAP_CONFIG.focusedZoom); else map.fitBounds(bounds, { padding: [36, 36], maxZoom: MAP_CONFIG.focusedZoom });
  }, [points, t]);
  useEffect(() => {
    const layer = selectionLayerRef.current; if (!layer) return; layer.clearLayers();
    if (!selection || !Number.isFinite(selection.latitude) || !Number.isFinite(selection.longitude)) return;
    const coordinates = [selection.latitude, selection.longitude];
    L.circleMarker(coordinates, { radius: 11, weight: 3, color: '#111827', fillColor: '#f7b84b', fillOpacity: .95, dashArray: '4 3' }).addTo(layer).bindTooltip(t('map.selectedPoint'));
    mapRef.current?.panTo(coordinates);
  }, [selection, t]);
  return <div ref={containerRef} className="trip-map" aria-label={t('map.aria')} />;
}
function createPopupNode(point, t) {
  const wrapper = document.createElement('div'); wrapper.className = 'trip-map-popup'; const source = document.createElement('small');
  source.textContent = point.source === 'reservation' ? t('map.reservation') : point.source === 'destination' ? t('map.destination') : point.source === 'savedPlace' ? t('map.savedPlace') : t('map.itinerary');
  const title = document.createElement('strong'); title.textContent = point.title; const subtitle = document.createElement('span'); subtitle.textContent = point.subtitle || t('map.savedCoordinates'); wrapper.append(source, title, subtitle); return wrapper;
}
