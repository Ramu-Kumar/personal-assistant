
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, useColorScheme, View, Text, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';

interface HomeScreenProps {
  navigation: {
    openDrawer: () => void;
    navigate: (screen: any) => void;
  };
}

export function HomeScreen({ navigation, isLowBattery }: HomeScreenProps & { isLowBattery: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const [helloMessage, setHelloMessage] = useState<string>('Loading...');

  const backgroundStyle: ViewStyle = {
    backgroundColor: isDarkMode ? '#000' : '#F5F5F5',
    flex: 1,
  };

  const contentContainerStyle: ViewStyle = {
    flex: 1,
    paddingLeft: safeAreaInsets.left,
    paddingRight: safeAreaInsets.right,
    alignItems: 'center',
    justifyContent: 'center',
  };

  useEffect(() => {
    // Android emulator cannot access localhost directly, needs 10.0.2.2 (or adb reverse)
    const url = 'https://personal-assistant-ezyo.onrender.com/hello';

    fetch(url)
      .then(response => response.text())
      .then(data => setHelloMessage(data))
      .catch(error => setHelloMessage('Error connecting to backend: ' + error.message));
  }, []);

  return (
    <View style={backgroundStyle}>
      {isLowBattery && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Low Battery: Please Charge Immediately!</Text>
        </View>
      )}
      <Header onMenuPress={navigation.openDrawer} />
      <View style={contentContainerStyle}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '600',
            color: isDarkMode ? '#FFF' : '#000',
            textAlign: 'center',
          }}>
          {helloMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 1000,
  },
  bannerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
