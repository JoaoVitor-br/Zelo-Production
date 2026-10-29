import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { COLORS, FONTS } from '../theme';

export default function MapaMap({
  style,
  loadingLocation,
  permissionDenied,
  region,
  locations,
  onRegionChange,
  onOpenRoute,
}) {
  if (loadingLocation || permissionDenied) {
    return (
      <View style={[style, styles.stateContainer]}>
        {loadingLocation ? (
          <>
            <ActivityIndicator size="large" color={COLORS.primaryBlue} />
            <Text style={styles.loadingText}>Obtendo sua localização...</Text>
          </>
        ) : (
          <Text style={styles.errorText}>Acesso ao GPS desativado.</Text>
        )}
      </View>
    );
  }

  return (
    <MapView
      style={style}
      region={region}
      showsUserLocation
      showsMyLocationButton
      onRegionChangeComplete={onRegionChange}
    >
      {locations.map((item) => (
        <Marker
          key={item.id}
          coordinate={{ latitude: item.latitude, longitude: item.longitude }}
          title={item.nome}
          description={`${item.endereco} • ${item.distancia}`}
          pinColor={item.tipo === 'farmacia' ? '#0084C8' : '#DC2626'}
        >
          <Callout onPress={() => onOpenRoute(item)}>
            <View style={styles.calloutView}>
              <Text style={styles.calloutTitle}>{item.nome}</Text>
              <Text style={styles.calloutSub}>{item.distancia} • Clique para rota</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: FONTS.medium,
  },
  errorText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: FONTS.medium,
  },
  calloutView: {
    padding: 4,
    maxWidth: 180,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.textDark,
  },
  calloutSub: {
    fontSize: 11,
    color: COLORS.primaryBlue,
    marginTop: 2,
  },
});
