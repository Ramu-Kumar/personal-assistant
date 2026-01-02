
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Alert } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { getBatteryLevel } from 'react-native-device-info';
import { Drawer } from './components/Drawer';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MyPlanScreen } from './screens/MyPlanScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TaskProvider } from './context/TaskContext';

type ScreenName = 'Home' | 'Profile' | 'Settings' | 'MyPlan';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('MyPlan');
  const [isLowBattery, setIsLowBattery] = useState(false);

  useEffect(() => {
    const checkBattery = async () => {
      try {
        const level = await getBatteryLevel();
        if (level !== -1 && level < 0.15) {
          setIsLowBattery(true);
        } else {
          setIsLowBattery(false);
        }
      } catch (error) {
        console.error("Failed to check battery level", error);
      }
    };

    checkBattery();
    const interval = setInterval(checkBattery, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const renderScreen = () => {
    // Pass navigation-like props to screens if needed
    const navigationProps = {
      openDrawer: () => {
        console.log('App: openDrawer called');
        setIsDrawerOpen(true);
      },
      navigate: (screen: string) => setActiveScreen(screen as ScreenName),
    };

    switch (activeScreen) {
      case 'Home':
        return <HomeScreen navigation={navigationProps} isLowBattery={isLowBattery} />;
      case 'Profile':
        return <ProfileScreen navigation={navigationProps} />;
      case 'Settings':
        return <SettingsScreen navigation={navigationProps} />;
      case 'MyPlan':
        return <MyPlanScreen navigation={navigationProps} />;
      default:
        return <HomeScreen navigation={navigationProps} isLowBattery={isLowBattery} />;
    }
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <TaskProvider>
        <ErrorBoundary>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <View style={styles.container}>
            {renderScreen()}
            <Drawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              onNavigate={(screen) => setActiveScreen(screen as ScreenName)}
              activeScreen={activeScreen}
            />
          </View>
        </ErrorBoundary>
      </TaskProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
