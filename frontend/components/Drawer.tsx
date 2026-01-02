
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    TouchableWithoutFeedback,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (screen: string) => void;
    activeScreen: string;
};

export const Drawer = ({ isOpen, onClose, onNavigate, activeScreen }: DrawerProps) => {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const drawerWidth = width * 0.7;

    const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('Drawer: useEffect, isOpen:', isOpen);
        if (isOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -drawerWidth,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen, slideAnim, fadeAnim, drawerWidth]);

    return (
        <View
            style={[
                styles.container,
                StyleSheet.absoluteFillObject,
                { zIndex: isOpen ? 1000 : -1 } // Hide behind everything when closed
            ]}
            pointerEvents={isOpen ? 'auto' : 'none'}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.drawer,
                    {
                        width: drawerWidth, // Dynamic width
                        transform: [{ translateX: slideAnim }],
                        paddingTop: insets.top + 20,
                        paddingBottom: insets.bottom + 20,
                    },
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.headerText}>Menu</Text>
                </View>

                <View style={styles.items}>
                    <DrawerItem
                        label="Home"
                        icon="🏠"
                        isActive={activeScreen === 'Home'}
                        onPress={() => {
                            onNavigate('Home');
                            onClose();
                        }}
                    />
                    <DrawerItem
                        label="Profile"
                        icon="👤"
                        isActive={activeScreen === 'Profile'}
                        onPress={() => {
                            onNavigate('Profile');
                            onClose();
                        }}
                    />
                    <DrawerItem
                        label="Settings"
                        icon="⚙️"
                        isActive={activeScreen === 'Settings'}
                        onPress={() => {
                            onNavigate('Settings');
                            onClose();
                        }}
                    />
                    <View style={styles.divider} />
                    <DrawerItem
                        label="My Plan"
                        icon="📅"
                        isActive={activeScreen === 'MyPlan'}
                        onPress={() => {
                            onNavigate('MyPlan');
                            onClose();
                        }}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const DrawerItem = ({
    label,
    icon,
    isActive,
    onPress,
}: {
    label: string;
    icon: string;
    isActive: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        style={[styles.item, isActive && styles.activeItem]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.itemIcon}>{icon}</Text>
        <Text style={[styles.itemLabel, isActive && styles.activeItemLabel]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        elevation: 1000,
        // zIndex handled effectively inline
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 1,
    },
    drawer: {
        height: '100%',
        backgroundColor: '#FFF',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    items: {
        paddingHorizontal: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 8,
    },
    activeItem: {
        backgroundColor: '#F5F5F5',
    },
    itemIcon: {
        fontSize: 20,
        marginRight: 15,
    },
    itemLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    activeItemLabel: {
        color: '#000',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 10,
        marginHorizontal: 15,
    },
});
