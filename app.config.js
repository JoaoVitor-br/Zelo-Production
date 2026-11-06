module.exports = ({ config }) => {
  const androidGoogleMapsApiKey = (
    process.env.ANDROID_GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    config.android?.config?.googleMaps?.apiKey ||
    ''
  ).trim();

  const plugins = [...(config.plugins || [])];
  if (androidGoogleMapsApiKey) {
    plugins.push(['react-native-maps', { androidGoogleMapsApiKey }]);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      androidGoogleMapsApiKeyConfigured: Boolean(androidGoogleMapsApiKey),
    },
  };
};
