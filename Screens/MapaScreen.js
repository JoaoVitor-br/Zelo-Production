import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING } from '../theme';
import MapaMap from './MapaMap';

// Fórmula de Haversine para calcular a distância exata entre o GPS do usuário e a coordenada do local
function calcularDistancia(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 'N/A';
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
  const d = R * c;

  if (d < 1) {
    return `${Math.round(d * 1000)}m`;
  }
  return `${d.toFixed(1)}km`;
}

export default function MapaScreen({ onVoltar }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('farmacia'); // 'farmacia' ou 'hospital'
  const [locais, setLocais] = useState([]);
  
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

  // 1. Solicita permissão e obtém o GPS atual do usuário
  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissaoNegada(true);
          Alert.alert(
            'Permissão negada',
            'É necessário permitir o acesso à localização para encontrar farmácias e hospitais próximos.'
          );
          setLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;
        const newCoords = { latitude, longitude };
        
        setUserLocation(newCoords);
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });

        // Busca locais reais ao obter a posição
        buscarLocaisProximos(latitude, longitude, filtro);
      } catch (error) {
        Alert.alert('Erro ao obter localização', 'Não foi possível acessar seu GPS atual.');
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // 2. Busca locais via OpenStreetMap Overpass API (Gratuito, em tempo real)
  const buscarLocaisProximos = async (lat, lon, tipoFiltro) => {
    if (!lat || !lon) return;
    setLoadingLocais(true);

    try {
      const amenityTag = tipoFiltro === 'farmacia' ? 'pharmacy' : 'hospital';
      // Busca nós e caminhos com tag amenity dentro de um raio de 5000 metros (5km)
      const query = `[out:json][timeout:15];(node["amenity"="${amenityTag}"](around:5000,${lat},${lon});way["amenity"="${amenityTag}"](around:5000,${lat},${lon}););out center 25;`;
      
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data && data.elements) {
        const resultados = data.elements
          .map((el) => {
            const itemLat = el.lat || el.center?.lat;
            const itemLon = el.lon || el.center?.lon;
            const tags = el.tags || {};
            
            const nome = tags.name || (tipoFiltro === 'farmacia' ? 'Farmácia' : 'Hospital / Unidade de Saúde');
            const rua = tags['addr:street']
              ? `${tags['addr:street']}${tags['addr:housenumber'] ? ', ' + tags['addr:housenumber'] : ''}`
              : tags['addr:suburb'] || tags['addr:city'] || 'Endereço próximo';

            const distStr = itemLat && itemLon ? calcularDistancia(lat, lon, itemLat, itemLon) : 'N/A';

            return {
              id: el.id.toString(),
              nome,
              endereco: rua,
              distancia: distStr,
              tipo: tipoFiltro,
              latitude: itemLat,
              longitude: itemLon,
            };
          })
          .filter((item) => item.latitude && item.longitude);

        setLocais(resultados);
      } else {
        setLocais([]);
      }
    } catch (error) {
      // Caso a API demore ou falhe
      Alert.alert('Aviso', 'Não foi possível carregar alguns estabelecimentos da região no momento.');
    } finally {
      setLoadingLocais(false);
    }
  };

  // Troca de filtro (Farmácias <-> Hospitais)
  const handleTrocarFiltro = (novoFiltro) => {
    setFiltro(novoFiltro);
    if (userLocation) {
      buscarLocaisProximos(userLocation.latitude, userLocation.longitude, novoFiltro);
    }
  };

  // Filtra locais na barra de pesquisa por nome ou endereço
  const locaisFiltrados = locais.filter((item) =>
    item.nome.toLowerCase().includes(busca.toLowerCase()) ||
    item.endereco.toLowerCase().includes(busca.toLowerCase())
  );

  // Abre aplicativo de mapas nativo (Google Maps / Apple Maps) com coordenadas ou endereço
  const abrirNoGPS = (item) => {
    const query = item.latitude && item.longitude 
      ? `${item.latitude},${item.longitude}` 
      : encodeURIComponent(`${item.nome}, ${item.endereco}`);
      
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(item.nome)}@${item.latitude},${item.longitude}`,
      android: `geo:0,0?q=${query}(${encodeURIComponent(item.nome)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o aplicativo de mapas.');
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
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    position: 'relative',
    marginBottom: 12,
    backgroundColor: '#E5E7EB',
  },
  map: {
    width: '100%',
    height: '100%',
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