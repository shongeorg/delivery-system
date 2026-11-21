<template>
  <div ref="el" class="leaflet-map" :style="{ height }" />
</template>

<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

const props = withDefaults(
  defineProps<{
    points: MapPoint[];
    line?: [number, number][];
    center?: { lat: number; lng: number };
    zoom?: number;
    height?: string;
    fit?: boolean;
  }>(),
  { zoom: 13, height: '320px', fit: true, line: undefined, center: undefined },
);

const el = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let layer: L.LayerGroup | null = null;

function colorFor(point: MapPoint): string {
  return point.color ?? '#3880ff';
}

function render(): void {
  if (!map || !layer) return;
  layer.clearLayers();

  props.points.forEach((point) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: 9,
      color: '#fff',
      weight: 2,
      fillColor: colorFor(point),
      fillOpacity: 1,
    });
    if (point.label) marker.bindPopup(point.label);
    marker.addTo(layer!);
  });

  if (props.line && props.line.length > 1) {
    L.polyline(props.line, { color: '#3880ff', weight: 4, opacity: 0.8 }).addTo(layer);
  }

  const coords: L.LatLngExpression[] = props.points.map((p) => [p.lat, p.lng]);
  if (props.line) coords.push(...props.line);

  if (props.fit && coords.length > 1) {
    map.fitBounds(L.latLngBounds(coords), { padding: [32, 32] });
  } else if (props.center) {
    map.setView([props.center.lat, props.center.lng], props.zoom);
  } else if (coords.length === 1) {
    map.setView(coords[0], props.zoom);
  }
}

onMounted(() => {
  if (!el.value) return;
  map = L.map(el.value, { zoomControl: true, attributionControl: true }).setView(
    props.center ? [props.center.lat, props.center.lng] : [50.4501, 30.5234],
    props.zoom,
  );
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  layer = L.layerGroup().addTo(map);
  render();
});

watch(() => [props.points, props.line], render, { deep: true });

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  layer = null;
});
</script>

<style scoped>
.leaflet-map {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  z-index: 0;
}
</style>
