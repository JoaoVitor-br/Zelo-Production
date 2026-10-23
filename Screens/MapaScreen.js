import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';

export default function MapaScreen({ onVoltar }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('farmacia'); // 'farmacia' ou 'hospital'

  const locais = [
    { id: 1, nome: 'Farmácia São Paulo - 24h', distancia: '450m', endereco: 'Av. Brasil, 1020', tipo: 'farmacia' },
    { id: 2, nome: 'Drogaria Zelo e Saúde', distancia: '800m', endereco: 'Rua das Flores, 45', tipo: 'farmacia' },
    { id: 3, nome: 'Hospital Central Unimed', distancia: '1.2km', endereco: 'Prança da Matriz, 500', tipo: 'hospital' },
    { id: 4, nome: 'Pronto Socorro Municipal', distancia: '2.1km', endereco: 'Av. Das Nações, 880', tipo: 'hospital' },
  ];

  const locaisFiltrados = locais.filter(
    (item) => item.tipo === filtro && item.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirNoGPS = (endereco) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    Linking.openURL(url).catch(() => {});
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

      {/* Renderização do Mapa */}
      <View style={styles.mapCanvas}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop' }}
          style={styles.mapImage}
        />
        <View style={styles.mapOverlayControls}>
          <TouchableOpacity
            style={[styles.filterBadge, filtro === 'farmacia' && styles.filterBadgeActive]}
            onPress={() => setFiltro('farmacia')}
          >
            <Text style={[styles.filterText, filtro === 'farmacia' && styles.filterTextActive]}>
              Farmácias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBadge, filtro === 'hospital' && styles.filterBadgeActive]}
            onPress={() => setFiltro('hospital')}
          >
            <Text style={[styles.filterText, filtro === 'hospital' && styles.filterTextActive]}>
              Hospitais
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Unidades Encontradas */}
      <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
        {locaisFiltrados.map((item) => (
          <View key={item.id} style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.nome}</Text>
              <Text style={styles.locationAddress}>{item.endereco}</Text>
              <Text style={styles.locationDist}>Distância: {item.distancia}</Text>
            </View>
            <TouchableOpacity
              style={styles.routeButton}
              onPress={() => abrirNoGPS(item.endereco)}
            >
              <Text style={styles.routeButtonText}>Rota</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setFiltro(filtro === 'farmacia' ? 'hospital' : 'farmacia')}
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
  },
  mapImage: { width: '100%', height: '100%' },
  mapOverlayControls: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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