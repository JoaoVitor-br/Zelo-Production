import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

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
  const webViewRef = useRef(null);

  const lat = region?.latitude || -23.55052;
  const lon = region?.longitude || -46.633308;

  // Atualiza a posição da câmera e os marcadores dentro do Leaflet OpenStreetMap
  useEffect(() => {
    if (webViewRef.current) {
      const script = `
        if (typeof window.atualizarMapa === 'function') {
          window.atualizarMapa(${lat}, ${lon}, ${JSON.stringify(locations || [])});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [lat, lon, locations]);

  // Atualiza ou desenha a rota quando as coordenadas da rota mudarem
  useEffect(() => {
    if (webViewRef.current) {
      const script = `
        if (typeof window.desenharRota === 'function') {
          window.desenharRota(${JSON.stringify(routeCoordinates || null)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [routeCoordinates]);

  // Recebe cliques de botões disparados de dentro dos popups do Leaflet
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_LOCATION' && data.location) {
        onOpenRoute(data.location);
      }
    } catch (e) {}
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e5e3df; }
    .custom-pin {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
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
      box-shadow: 0 0 0 5px rgba(37,99,235,0.35);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      padding: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .popup-box { padding: 4px; }
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
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${lat}, ${lon}], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var userMarker = L.marker([${lat}, ${lon}], {
      icon: L.divIcon({ className: '', html: '<div class="pin-user"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })
    }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);
    var routeLayer = null;

    window.atualizarMapa = function(newLat, newLon, locs) {
      if (newLat && newLon) {
        if (!routeLayer) {
          map.setView([newLat, newLon], map.getZoom());
        }
        userMarker.setLatLng([newLat, newLon]);
      }
      markersLayer.clearLayers();

      if (locs && locs.length > 0) {
        locs.forEach(function(item) {
          if (!item.latitude || !item.longitude) return;
          var isFarm = (item.tipo === 'farmacia');
          var iconEmoji = isFarm ? '💊' : '🏥';
          var pinClass = isFarm ? 'pin-farmacia' : 'pin-hospital';
          var iconHtml = '<div class="custom-pin ' + pinClass + '">' + iconEmoji + '</div>';

          var customIcon = L.divIcon({
            className: '',
            html: iconHtml,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
          });

          var marker = L.marker([item.latitude, item.longitude], { icon: customIcon });
          var itemEscaped = JSON.stringify(item).replace(/"/g, '&quot;');
          var popupContent = '<div class="popup-box">' +
            '<div class="popup-title">' + item.nome + '</div>' +
            '<div class="popup-sub">' + item.endereco + ' • ' + item.distancia + '</div>' +
            '<a class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ type: \\'SELECT_LOCATION\\', location: ' + JSON.stringify(item).replace(/"/g, '\\"') + ' }))">Traçar Rota no App</a>' +
            '</div>';

          marker.bindPopup(popupContent);
          markersLayer.addLayer(marker);
        });
      }
    };

    // Desenha a rota na tela e ajusta a visão para enquadrar todo o trajeto
    window.desenharRota = function(coords) {
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }

      if (!coords || coords.length === 0) {
        map.setView([${lat}, ${lon}], 14);
        return;
      }

      // GeoJSON vem em [lon, lat] -> Leaflet usa [lat, lon]
      var latLngs = coords.map(function(c) {
        return [c[1], c[0]];
      });

      routeLayer = L.polyline(latLngs, {
        color: '#0084C8',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(map);

      map.fitBounds(routeLayer.getBounds(), { padding: [35, 35] });
    };

    window.atualizarMapa(${lat}, ${lon}, ${JSON.stringify(locations || [])});
    if (${JSON.stringify(routeCoordinates || null)}) {
      window.desenharRota(${JSON.stringify(routeCoordinates || null)});
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={style}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: '#E5E3DF',
    borderRadius: 18,
  },
});
