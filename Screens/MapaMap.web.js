import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export default function MapaMap({
  style,
  loadingLocation,
  permissionDenied,
  region,
  locations,
  routeCoordinates,
  onRegionChange,
  onOpenRoute,
}) {
  const iframeRef = useRef(null);

  const lat = region?.latitude || -23.55052;
  const lon = region?.longitude || -46.633308;

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'UPDATE_LOCATIONS', lat, lon, locations, routeCoordinates }),
        '*'
      );
    }
  }, [lat, lon, locations, routeCoordinates]);

  useEffect(() => {
    const handleWindowMsg = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SELECT_LOCATION' && data.location) {
          onOpenRoute(data.location);
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleWindowMsg);
    return () => window.removeEventListener('message', handleWindowMsg);
  }, [onOpenRoute]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e5e3df; }
    .custom-pin {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: white;
      font-weight: bold;
    }
    .pin-farmacia { background-color: #0084C8; }
    .pin-hospital { background-color: #DC2626; }
    .pin-user {
      width: 18px;
      height: 18px;
      background-color: #2563EB;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.3);
    }
    .popup-box { padding: 4px; font-family: sans-serif; }
    .popup-title { font-weight: bold; font-size: 14px; color: #1E293B; margin-bottom: 2px; }
    .popup-sub { font-size: 12px; color: #64748B; margin-bottom: 8px; }
    .popup-btn {
      display: block;
      background: #0084C8;
      color: white;
      text-align: center;
      padding: 7px 12px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lon}], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    var userMarker = L.marker([${lat}, ${lon}], {
      icon: L.divIcon({ className: '', html: '<div class="pin-user"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })
    }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);
    var routeLayer = null;

    function desenharRota(coords) {
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }
      if (!coords || coords.length === 0) return;
      var latLngs = coords.map(function(c) { return [c[1], c[0]]; });
      routeLayer = L.polyline(latLngs, {
        color: '#0084C8',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [35, 35] });
    }

    function renderLocs(newLat, newLon, locs, rCoords) {
      if (newLat && newLon && !routeLayer) {
        map.setView([newLat, newLon], map.getZoom());
        userMarker.setLatLng([newLat, newLon]);
      }
      markersLayer.clearLayers();
      if (locs && locs.length > 0) {
        locs.forEach(function(item) {
          if (!item.latitude || !item.longitude) return;
          var isFarm = (item.tipo === 'farmacia');
          var iconHtml = '<div class="custom-pin ' + (isFarm ? 'pin-farmacia' : 'pin-hospital') + '">' + (isFarm ? '💊' : '🏥') + '</div>';
          var customIcon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
          var marker = L.marker([item.latitude, item.longitude], { icon: customIcon });
          var popupContent = '<div class="popup-box">' +
            '<div class="popup-title">' + item.nome + '</div>' +
            '<div class="popup-sub">' + item.endereco + ' • ' + item.distancia + '</div>' +
            '<a class="popup-btn" onclick="window.parent.postMessage(JSON.stringify({ type: \\'SELECT_LOCATION\\', location: ' + JSON.stringify(item).replace(/"/g, '\\"') + ' }), \\'*\\')">Traçar Rota no App</a>' +
            '</div>';
          marker.bindPopup(popupContent);
          markersLayer.addLayer(marker);
        });
      }
      if (rCoords) {
        desenharRota(rCoords);
      }
    }

    renderLocs(${lat}, ${lon}, ${JSON.stringify(locations || [])}, ${JSON.stringify(routeCoordinates || null)});

    window.addEventListener('message', function(event) {
      try {
        var d = JSON.parse(event.data);
        if (d.type === 'UPDATE_LOCATIONS') {
          renderLocs(d.lat, d.lon, d.locations, d.routeCoordinates);
        }
      } catch(e) {}
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={[style, { overflow: 'hidden', borderRadius: 18 }]}>
      <iframe
        ref={iframeRef}
        title="OpenStreetMap Interativo"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        srcDoc={htmlContent}
      />
    </View>
  );
}
