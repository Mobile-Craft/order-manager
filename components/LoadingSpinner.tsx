import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function LoadingSpinner({ message = 'Cargando...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#DC2626" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});