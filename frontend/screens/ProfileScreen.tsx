
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../components/Header';

export const ProfileScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <Header onMenuPress={() => navigation.openDrawer()} />
            <View style={styles.content}>
                <Text style={styles.text}>Profile Page</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 20, fontWeight: 'bold' },
});
