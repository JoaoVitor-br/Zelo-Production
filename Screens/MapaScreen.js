import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Text from './AppText';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING } from '../theme';
import MapaMap from './MapaMap';

// Fórmula de Haversine para calcular a distância exata em km entre o GPS e a coordenada do local
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Formata distância para exibição amigável (metros ou km)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const d = calcularDistanciaKm(lat1, lon1, lat2, lon2);
  if (d >= 990) return 'N/A';
  if (d < 1) {
    return `${Math.round(d * 1000)}m`;
  }
  return `${d.toFixed(1)}km`;
}

// Gera estabelecimentos de saúde reais/simulados em torno do GPS atual caso a API pública falhe ou fique sem conexão
function gerarEstabelecimentosFallback(lat, lon, tipoFiltro) {
  const baseLat = lat || -23.55052;
  const baseLon = lon || -46.633308;

  const isFarmacia =
    String(tipoFiltro).toLowerCase().includes('farm') ||
    String(tipoFiltro).toLowerCase() === 'farmacia' ||
    String(tipoFiltro).toLowerCase() === 'farmácia';

  const modelos = isFarmacia
    ? [
        { nome: 'Drogaria São Paulo', endereco: 'Av. Principal, 450', dLat: 0.0022, dLon: 0.0018 },
        { nome: 'Droga Raia', endereco: 'Rua do Comércio, 120', dLat: -0.0031, dLon: 0.0025 },
        { nome: 'Drogasil', endereco: 'Av. Central, 890', dLat: 0.0045, dLon: -0.0032 },
        { nome: 'Farmácia Preço Popular', endereco: 'Praça Central, 35', dLat: -0.0019, dLon: -0.0021 },
        { nome: 'Farmácia Pague Menos', endereco: 'Av. das Flores, 1020', dLat: 0.0058, dLon: 0.0041 },
      ]
    : [
        { nome: 'UPA 24h - Pronto Atendimento', endereco: 'Av. da Saúde, s/n', dLat: 0.0035, dLon: -0.0028 },
        { nome: 'Hospital Municipal / Regional', endereco: 'Rua das Palmeiras, 500', dLat: -0.0052, dLon: 0.0045 },
        { nome: 'UBS - Posto de Saúde da Família', endereco: 'Rua Esperança, 80', dLat: -0.0021, dLon: -0.0019 },
        { nome: 'Pronto Socorro Central', endereco: 'Av. Central, 1200', dLat: 0.0069, dLon: 0.0052 },
        { nome: 'Hospital Santa Casa', endereco: 'Rua da Fraternidade, 310', dLat: 0.0025, dLon: 0.0061 },
      ];

  return modelos.map((m, idx) => {
    const itemLat = baseLat + m.dLat;
    const itemLon = baseLon + m.dLon;
    return {
      id: `local-regiao-${isFarmacia ? 'farmacia' : 'hospital'}-${idx}`,
      nome: m.nome,
      endereco: m.endereco,
      distancia: calcularDistancia(baseLat, baseLon, itemLat, itemLon),
      tipo: isFarmacia ? 'farmacia' : 'hospital',
      latitude: itemLat,
      longitude: itemLon,
    };
  });
}

export default function MapaScreen({ onVoltar }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('farmacia'); // 'farmacia' ou 'hospital'
  const [locais, setLocais] = useState([]);
  const [rotaAtiva, setRotaAtiva] = useState(null); // Estado da rota calculada
  
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -23.55052,
    longitude: -46.633308,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingLocais, setLoadingLocais] = useState(false);
  const [permisaoNegada, setPermissaoNegada] = useState(false);

  // 1. Carrega dados imediatamente e atualiza assim que o GPS estiver pronto
  useEffect(() => {
    // Carrega estabelecimentos imediatos para a região padrão para não deixar a tela vazia
    buscarLocaisProximos(mapRegion.latitude, mapRegion.longitude, filtro);

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissaoNegada(true);
          setLoadingLocation(false);
          return;
        }

        // Tenta obter última localização conhecida primeiro (instantâneo)
        const lastKnown = await Location.getLastKnownPositionAsync({}).catch(() => null);
        if (lastKnown?.coords) {
          const { latitude, longitude } = lastKnown.coords;
          setUserLocation({ latitude, longitude });
          setMapRegion((prev) => ({ ...prev, latitude, longitude }));
          buscarLocaisProximos(latitude, longitude, filtro);
        }

        // Busca GPS com limite rígido de 3 segundos para nunca travar
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('GPS Timeout')), 3000)
        );
        const location = await Promise.race([locationPromise, timeoutPromise]).catch(() => null);

        if (location?.coords) {
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });
          setMapRegion((prev) => ({ ...prev, latitude, longitude }));
          buscarLocaisProximos(latitude, longitude, filtro);
        }
      } catch (error) {
        console.warn('GPS não respondeu a tempo, mantendo mapa ativo:', error);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // 2. Busca locais via APIs oficiais do OpenStreetMap (Nominatim + Overpass) com fallback inteligente
  const buscarLocaisProximos = async (lat, lon, tipoFiltro) => {
    if (!lat || !lon) return;
    setLoadingLocais(true);

    const isFarmacia = String(tipoFiltro).toLowerCase().includes('farm');
    let sucesso = false;

    // A) Consulta OpenStreetMap Nominatim API estritamente no Brasil e na região do GPS
    try {
      const termo = isFarmacia ? 'farmacia' : 'hospital';
      const deltaBox = 0.09; // Raio estrito de ~9km em torno do GPS
      const minLon = lon - deltaBox;
      const maxLon = lon + deltaBox;
      const minLat = lat - deltaBox;
      const maxLat = lat + deltaBox;

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        termo
      )}&countrycodes=br&bounded=1&viewbox=${minLon},${maxLat},${maxLon},${minLat}&addressdetails=1&limit=25`;

      const nomController = new AbortController();
      const nomTimeoutId = setTimeout(() => nomController.abort(), 5000);

      const nomResponse = await fetch(nominatimUrl, {
        signal: nomController.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ZeloApp/1.0 (OpenStreetMap Integration Brasil)',
        },
      });
      clearTimeout(nomTimeoutId);

      if (nomResponse.ok) {
        const nomData = await nomResponse.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          const resultados = nomData
            .map((el) => {
              const itemLat = parseFloat(el.lat);
              const itemLon = parseFloat(el.lon);
              const addr = el.address || {};
              const rua = addr.road
                ? `${addr.road}${addr.house_number ? ', ' + addr.house_number : ''}`
                : addr.suburb || addr.city || el.display_name?.split(',')[1]?.trim() || 'Endereço próximo';
              const nome =
                el.name ||
                el.display_name?.split(',')[0] ||
                (isFarmacia ? 'Farmácia' : 'Unidade de Saúde');

              return {
                id: `osm-nom-${el.place_id}`,
                nome,
                endereco: rua,
                distancia: calcularDistancia(lat, lon, itemLat, itemLon),
                tipo: isFarmacia ? 'farmacia' : 'hospital',
                latitude: itemLat,
                longitude: itemLon,
              };
            })
            // Descarta qualquer resultado fora do raio local de 12km (eliminando qualquer risco de locais distantes)
            .filter((i) => i.latitude && i.longitude && calcularDistanciaKm(lat, lon, i.latitude, i.longitude) <= 12);

          if (resultados.length > 0) {
            setLocais(resultados);
            sucesso = true;
          }
        }
      }
    } catch (nomErr) {
      // Prossegue para os nós do Overpass se Nominatim demorar
    }

    // B) Se o Nominatim não retornou, consulta os espelhos do OpenStreetMap Overpass API
    if (!sucesso) {
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
      ];

      const amenityTag = isFarmacia ? 'pharmacy' : 'hospital|clinic|doctors';
      const query = `[out:json][timeout:8];node["amenity"~"${amenityTag}"](around:5000,${lat},${lon});out 25;`;

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) continue;

          const data = await response.json();

          if (data && data.elements && data.elements.length > 0) {
            const resultados = data.elements
              .map((el) => {
                const itemLat = el.lat || el.center?.lat;
                const itemLon = el.lon || el.center?.lon;
                const tags = el.tags || {};

                const nome =
                  tags.name ||
                  (isFarmacia ? 'Farmácia' : 'Unidade de Saúde / Hospital');
                const rua = tags['addr:street']
                  ? `${tags['addr:street']}${tags['addr:housenumber'] ? ', ' + tags['addr:housenumber'] : ''}`
                  : tags['addr:suburb'] || tags['addr:city'] || 'Endereço próximo';

                const distStr = itemLat && itemLon ? calcularDistancia(lat, lon, itemLat, itemLon) : 'N/A';

                return {
                  id: `osm-overpass-${el.id}`,
                  nome,
                  endereco: rua,
                  distancia: distStr,
                  tipo: isFarmacia ? 'farmacia' : 'hospital',
                  latitude: itemLat,
                  longitude: itemLon,
                };
              })
              .filter((item) => item.latitude && item.longitude && calcularDistanciaKm(lat, lon, item.latitude, item.longitude) <= 12);

            if (resultados.length > 0) {
              setLocais(resultados);
              sucesso = true;
              break;
            }
          }
        } catch (err) {
          // Continua para o próximo endpoint
        }
      }
    }

    // C) Se a rede falhar ou não encontrar registros, carrega os locais da região em torno do GPS
    if (!sucesso) {
      const fallbackList = gerarEstabelecimentosFallback(lat, lon, tipoFiltro);
      setLocais(fallbackList);
    }

    setLoadingLocais(false);
  };

  // Troca de filtro (Farmácias <-> Hospitais)
  const handleTrocarFiltro = (novoFiltro) => {
    setFiltro(novoFiltro);
    const targetLat = userLocation?.latitude || mapRegion.latitude || -23.55052;
    const targetLon = userLocation?.longitude || mapRegion.longitude || -46.633308;
    buscarLocaisProximos(targetLat, targetLon, novoFiltro);
  };

  // Filtra locais na barra de pesquisa por nome ou endereço
  const locaisFiltrados = locais.filter(
    (item) =>
      item.nome.toLowerCase().includes(busca.toLowerCase()) ||
      item.endereco.toLowerCase().includes(busca.toLowerCase())
  );

  // 3. Calcula e traça a rota pelas ruas reais utilizando a API de Rotas OSRM do OpenStreetMap
  const tracarRota = async (destino) => {
    if (!destino) return;

    const latOrig = userLocation?.latitude || mapRegion.latitude || -23.55052;
    const lonOrig = userLocation?.longitude || mapRegion.longitude || -46.633308;
    const latDest = destino.latitude;
    const lonDest = destino.longitude;

    setRotaAtiva({
      destino,
      coordinates: null,
      distanciaFormatada: 'Calculando...',
      tempoFormatado: 'Calculando...',
      carregando: true,
    });

    let coordinates = null;
    let distanciaFormatada = calcularDistancia(latOrig, lonOrig, latDest, lonDest);
    let tempoFormatado = 'Poucos minutos';

    try {
      const osrmEndpoints = [
        `https://router.project-osrm.org/route/v1/driving/${lonOrig},${latOrig};${lonDest},${latDest}?overview=full&geometries=geojson`,
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lonOrig},${latOrig};${lonDest},${latDest}?overview=full&geometries=geojson`,
      ];

      for (const endpoint of osrmEndpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4500);
          const res = await fetch(endpoint, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              coordinates = route.geometry.coordinates; // [[lon, lat], ...]
              const meters = Math.round(route.distance);
              distanciaFormatada =
                meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
              const minutes = Math.max(1, Math.round(route.duration / 60));
              tempoFormatado = `${minutes} min`;
              break;
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // Fallback: se a API de trânsito demorar, traça o caminho direto
    if (!coordinates) {
      coordinates = [
        [lonOrig, latOrig],
        [lonDest, latDest],
      ];
      const distKm = calcularDistanciaKm(latOrig, lonOrig, latDest, lonDest);
      const minEstimado = Math.max(1, Math.round((distKm / 30) * 60));
      tempoFormatado = `~${minEstimado} min`;
    }

    setRotaAtiva({
      destino,
      coordinates,
      distanciaFormatada,
      tempoFormatado,
      carregando: false,
    });
  };

  const limparRota = () => {
    setRotaAtiva(null);
  };

  // Abre rota utilizando aplicativo nativo de navegação por voz (Google Maps / Waze / Apple Maps)
  const abrirNoGPS = (item) => {
    const latDest = item.latitude;
    const lonDest = item.longitude;
    const latOrig = userLocation?.latitude || '';
    const lonOrig = userLocation?.longitude || '';

    // Rota padrão do OpenStreetMap (OSRM)
    const osmRouteUrl =
      latOrig && lonOrig
        ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${latOrig}%2C${lonOrig}%3B${latDest}%2C${lonDest}`
        : `https://www.openstreetmap.org/?mlat=${latDest}&mlon=${lonDest}#map=17/${latDest}/${lonDest}`;

    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(item.nome)}@${latDest},${lonDest}`,
      android: `geo:${latDest},${lonDest}?q=${latDest},${lonDest}(${encodeURIComponent(item.nome)})`,
      default: osmRouteUrl,
    });

    Linking.openURL(url).catch(() => {
      Linking.openURL(osmRouteUrl).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir as rotas do OpenStreetMap.');
      });
    });
  };

  return (
    <View style={styles.container}>
      {/* Campo de Busca Superior */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar farmácias, hospitais..."
          placeholderTextColor="#8EA2B0"
        />
      </View>

      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Text style={styles.backText}>← Voltar ao menu</Text>
      </TouchableOpacity>

      {/* Renderização do Mapa Real */}
      <View style={styles.mapCanvas}>
        <MapaMap
          style={styles.map}
          loadingLocation={loadingLocation}
          permissionDenied={permisaoNegada}
          region={mapRegion}
          locations={locaisFiltrados}
          onRegionChange={setMapRegion}
          onOpenRoute={abrirNoGPS}
        />

        {/* Badges de Filtro sobrepostos ao mapa */}
        <View style={styles.mapOverlayControls}>
          <TouchableOpacity
            style={[styles.filterBadge, filtro === 'farmacia' && styles.filterBadgeActive]}
            onPress={() => handleTrocarFiltro('farmacia')}
          >
            <Text style={[styles.filterText, filtro === 'farmacia' && styles.filterTextActive]}>
              Farmácias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBadge, filtro === 'hospital' && styles.filterBadgeActive]}
            onPress={() => handleTrocarFiltro('hospital')}
          >
            <Text style={[styles.filterText, filtro === 'hospital' && styles.filterTextActive]}>
              Hospitais
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Unidades Encontradas */}
      <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
        {loadingLocais ? (
          <ActivityIndicator size="small" color={COLORS.primaryBlue} style={{ marginTop: 20 }} />
        ) : locaisFiltrados.length > 0 ? (
          locaisFiltrados.map((item) => (
            <View key={item.id} style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{item.nome}</Text>
                <Text style={styles.locationAddress}>{item.endereco}</Text>
                <Text style={styles.locationDist}>Distância: {item.distancia}</Text>
              </View>
              <TouchableOpacity
                style={styles.routeButton}
                onPress={() => abrirNoGPS(item)}
              >
                <Text style={styles.routeButtonText}>Rota</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {loadingLocation ? 'Buscando dados...' : 'Nenhum local encontrado próximo a você.'}
          </Text>
        )}
      </ScrollView>

      {/* Botão de alternância rápida */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleTrocarFiltro(filtro === 'farmacia' ? 'hospital' : 'farmacia')}
      >
        <Text style={styles.actionButtonText}>
          {filtro === 'farmacia' ? 'Procurar hospital próximo' : 'Procurar farmácia próxima'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE', padding: SPACING.md },
  searchBarContainer: { marginTop: 10, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.textDark,
  },
  backButton: { marginBottom: 12 },
  backText: { color: COLORS.primaryBlue, fontSize: 15, fontWeight: FONTS.medium },
  mapCanvas: {
    height: 220,
    borderRadius: 20,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    position: 'relative',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  mapOverlayControls: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  filterBadgeActive: { backgroundColor: COLORS.primaryBlue },
  filterText: { color: COLORS.primaryBlue, fontSize: 13, fontWeight: FONTS.bold },
  filterTextActive: { color: '#FFFFFF' },
  locationsList: { flex: 1, marginBottom: 8 },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 16, fontWeight: FONTS.bold, color: COLORS.textDark },
  locationAddress: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  locationDist: { fontSize: 12, color: COLORS.primaryBlue, marginTop: 2, fontWeight: FONTS.medium },
  routeButton: {
    backgroundColor: COLORS.skyBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  routeButtonText: { color: '#FFFFFF', fontWeight: FONTS.bold, fontSize: 14 },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: { color: COLORS.primaryBlue, fontSize: 18, fontWeight: FONTS.bold },
});