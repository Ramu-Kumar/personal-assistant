
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'Home' | 'Assistant' | 'Settings';

const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'Home', icon: '🏠', label: 'Home' },
    { key: 'Assistant', icon: '✨', label: 'Assistant' },
    { key: 'Settings', icon: '⚙️', label: 'Settings' },
];

export const Navbar = () => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = React.useState<Tab>('Assistant');

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.content}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={styles.tab}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                                <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
                            </View>
                            {isActive && <Text style={styles.label}>{tab.label}</Text>}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -10,
        },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 20,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    iconContainer: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    activeIconContainer: {
        backgroundColor: '#F0F0F0',
    },
    icon: {
        fontSize: 24,
        opacity: 0.5,
    },
    activeIcon: {
        opacity: 1,
        transform: [{ scale: 1.1 }],
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        color: '#000',
        marginTop: 4,
    },
});
