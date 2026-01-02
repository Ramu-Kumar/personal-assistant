
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Header = ({ onMenuPress }: { onMenuPress?: () => void }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <View style={styles.leftContainer}>
                    <Text style={styles.greeting}>Good Evening,</Text>
                    <Text style={styles.username}>Ramu</Text>
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={() => {
                    console.log('Header: Menu pressed');
                    if (onMenuPress) onMenuPress();
                }}>
                    <Text style={styles.profileIcon}>☰</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 100,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
        paddingTop: 10,
    },
    leftContainer: {
        flexDirection: 'column',
    },
    greeting: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileIcon: {
        fontSize: 20,
    },
});
