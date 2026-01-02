import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, TouchableWithoutFeedback, PanResponder, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomDatePickerProps {
    visible: boolean;
    onClose: () => void;
    value: Date;
    onChange: (date: Date) => void;
}

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = Math.min(width * 0.9, 340);
const DAY_SIZE = (CALENDAR_WIDTH - 32) / 7;
const CLOCK_RADIUS = (CALENDAR_WIDTH - 60) / 2;
const CLOCK_CENTER = CLOCK_RADIUS;

export const CustomDatePicker = ({ visible, onClose, value, onChange }: CustomDatePickerProps) => {
    // ----------------------------------------------------------------------
    // 1. SAFE GUARDS & HELPERS
    // ----------------------------------------------------------------------

    // Helper to ensure we always work with a valid Date object
    const getValidDate = (d: any): Date => {
        if (d instanceof Date && !isNaN(d.getTime())) {
            return d;
        }
        // Fallback to now if invalid
        return new Date();
    };

    // Initialize with a guaranteed valid date
    const safeValue = getValidDate(value);

    // ----------------------------------------------------------------------
    // 2. STATE LOGIC
    // ----------------------------------------------------------------------

    const [mode, setMode] = useState<'DATE' | 'TIME'>('DATE');
    const [viewDate, setViewDate] = useState(safeValue);

    // Time Picker State
    const [clockMode, setClockMode] = useState<'HOUR' | 'MINUTE'>('HOUR');
    const [isAm, setIsAm] = useState(safeValue.getHours() < 12);

    // Refs for PanResponder (so it doesn't need to be recreated on every render)
    // We use refs to access the *latest* state inside the closure-captured PanResponder
    const clockModeRef = useRef(clockMode);
    const isAmRef = useRef(isAm);
    const valueRef = useRef(safeValue);

    // Keep refs in sync
    useEffect(() => {
        clockModeRef.current = clockMode;
        isAmRef.current = isAm;
        valueRef.current = getValidDate(value);
    }, [clockMode, isAm, value]);

    // Reset internal state when modal opens
    useEffect(() => {
        if (visible) {
            const freshValid = getValidDate(value);
            setViewDate(freshValid);
            setMode('DATE');
            setClockMode('HOUR');
            setIsAm(freshValid.getHours() < 12);
        }
    }, [visible]);

    // ----------------------------------------------------------------------
    // 3. CALENDAR LOGIC
    // ----------------------------------------------------------------------

    const changeMonth = (increment: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setViewDate(newDate);
    };

    const generateCalendarGrid = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

        // Adjust for Mon-Start week: 0(Sun) -> 6, 1(Mon) -> 0, etc.
        const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const days = [];

        // Pad start
        for (let i = 0; i < startDayIndex; i++) {
            days.push({ id: `pad-${i}`, day: null, fullDate: null });
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            days.push({ id: `day-${i}`, day: i, fullDate: d });
        }
        return days;
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const handleDateSelect = (date: Date) => {
        // We want to keep the current time from 'value', but update the year/month/day
        const currentValid = getValidDate(value);
        const newDate = new Date(currentValid);

        newDate.setFullYear(date.getFullYear());
        newDate.setMonth(date.getMonth());
        newDate.setDate(date.getDate());

        onChange(newDate);
    };

    const grid = useMemo(() => generateCalendarGrid(), [viewDate]);
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // ----------------------------------------------------------------------
    // 4. CLOCK LOGIC
    // ----------------------------------------------------------------------

    const updateTimeFromAngle = (x: number, y: number) => {
        const dx = x - CLOCK_CENTER;
        const dy = y - CLOCK_CENTER;

        // Angle in degrees, 0 at 3 o'clock, +ve clockwise
        // Math.atan2(dy, dx) gives radians from -PI to +PI
        // We want 12 o'clock to be 0/360

        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        const currentMode = clockModeRef.current;
        const currentIsAm = isAmRef.current;
        const currentValue = valueRef.current;
        const newDate = new Date(currentValue);

        if (currentMode === 'HOUR') {
            // 360 degrees / 12 hours = 30 degrees per hour
            let hour = Math.round(angle / 30);
            if (hour === 0) hour = 12;

            // Convert visual hour (1-12) to 24h format based on AM/PM
            if (currentIsAm) {
                // AM: 12->0, 1->1 ... 11->11
                if (hour === 12) hour = 0;
            } else {
                // PM: 12->12, 1->13 ... 11->23
                if (hour !== 12) hour += 12;
            }
            newDate.setHours(hour);
            onChange(newDate);
        } else {
            // 360 / 60 = 6 degrees per minute
            let minute = Math.round(angle / 6);
            if (minute === 60) minute = 0;
            newDate.setMinutes(minute);
            onChange(newDate);
        }
    };

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt, gestureState) => {
            updateTimeFromAngle(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt, gestureState) => {
            updateTimeFromAngle(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: (evt, gestureState) => {
            // Auto-advance logic
            if (clockModeRef.current === 'HOUR') {
                setClockMode('MINUTE');
            }
        }
    }), []);

    const toggleAmPm = () => {
        const newIsAm = !isAm;
        setIsAm(newIsAm);

        const currentValid = getValidDate(value);
        const h = currentValid.getHours();
        const newDate = new Date(currentValid);

        if (newIsAm) {
            // Switched to AM. If it was PM (12-23), subtract 12. 
            // Exception: 12 PM is 12, becomes 12 AM (0). 
            // Actually simpler: if h >= 12, h -= 12. e.g. 13 -> 1, 12 -> 0.
            if (h >= 12) newDate.setHours(h - 12);
        } else {
            // Switched to PM. If it was AM (0-11), add 12.
            // Exception: 0 AM (12 visual) becomes 12 PM (12).
            if (h < 12) newDate.setHours(h + 12);
        }
        onChange(newDate);
    };

    // ----------------------------------------------------------------------
    // 5. RENDER HELPERS
    // ----------------------------------------------------------------------

    const renderClockFace = () => {
        const currentValid = getValidDate(value);

        // Calculate hand rotation
        let angle = 0;
        if (clockMode === 'HOUR') {
            let h = currentValid.getHours() % 12;
            if (h === 0) h = 12;
            angle = h * 30;
        } else {
            angle = currentValid.getMinutes() * 6;
        }
        const handRotation = `${angle}deg`;

        // Generate numbers
        const numbers = [];
        if (clockMode === 'HOUR') {
            for (let i = 1; i <= 12; i++) numbers.push(i);
        } else {
            for (let i = 0; i < 60; i += 5) numbers.push(i);
        }

        return (
            <View style={styles.clockContainer}>
                {/* AM/PM Toggles */}
                <View style={styles.amPmContainer}>
                    <TouchableOpacity
                        style={[styles.amPmButton, isAm && styles.amPmSelected]}
                        onPress={() => !isAm && toggleAmPm()}
                    >
                        <Text style={[styles.amPmText, isAm && styles.amPmTextSelected]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.amPmButton, !isAm && styles.amPmSelected]}
                        onPress={() => isAm && toggleAmPm()}
                    >
                        <Text style={[styles.amPmText, !isAm && styles.amPmTextSelected]}>PM</Text>
                    </TouchableOpacity>
                </View>

                {/* Digital Time Header */}
                <View style={styles.timeDisplay}>
                    <TouchableOpacity onPress={() => setClockMode('HOUR')}>
                        <Text style={[styles.digitalTimeText, clockMode === 'HOUR' && styles.activeTimeText]}>
                            {(currentValid.getHours() % 12 || 12).toString().padStart(2, '0')}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.digitalTimeSeparator}>:</Text>
                    <TouchableOpacity onPress={() => setClockMode('MINUTE')}>
                        <Text style={[styles.digitalTimeText, clockMode === 'MINUTE' && styles.activeTimeText]}>
                            {currentValid.getMinutes().toString().padStart(2, '0')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Analog Face */}
                <View style={styles.clockFace}>
                    {/* Hand */}
                    <View
                        style={[
                            styles.clockHandContainer,
                            { transform: [{ rotate: handRotation }] }
                        ]}
                    >
                        <View style={styles.clockHandLine} />
                        <View style={styles.clockHandCircle} />
                    </View>

                    {/* Center Dot */}
                    <View style={styles.centerDot} />

                    {/* Numbers */}
                    {numbers.map((num, i) => {
                        const numAngle = (clockMode === 'HOUR' ? num * 30 : (num / 5) * 30);
                        const rad = (numAngle - 90) * (Math.PI / 180);
                        const radius = CLOCK_RADIUS - 30; // Text inset

                        const left = CLOCK_CENTER + radius * Math.cos(rad) - 15;
                        const top = CLOCK_CENTER + radius * Math.sin(rad) - 15;

                        // Check selection
                        let isSelected = false;
                        if (clockMode === 'HOUR') {
                            const h = currentValid.getHours() % 12 || 12;
                            isSelected = h === num;
                        } else {
                            isSelected = currentValid.getMinutes() === num;
                        }

                        return (
                            <View key={i} style={[styles.clockNumber, { left, top }]}>
                                <Text style={[styles.clockNumberText, isSelected && styles.selectedClockNumberText]}>
                                    {clockMode === 'MINUTE' && num === 0 ? '00' : num.toString()}
                                </Text>
                            </View>
                        );
                    })}

                    {/* Touch Layer */}
                    <View
                        style={styles.touchOverlay}
                        {...panResponder.panHandlers}
                    />
                </View>
            </View>
        );
    };

    // ----------------------------------------------------------------------
    // 6. MAIN RENDER
    // ----------------------------------------------------------------------

    const currentValid = getValidDate(value);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* 
                   IMPORTANT: This TouchableWithoutFeedback stops the 'onPress' from 
                   bubbling up to the overlay, preventing accidental close when clicking 
                   inside the modal background.
                */}
                <TouchableWithoutFeedback onPress={() => { }}>
                    <View style={styles.container}>

                        {/* Header for Date Mode */}
                        {mode === 'DATE' && (
                            <View style={styles.header}>
                                <Text style={styles.monthTitle}>
                                    {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                                </Text>
                                <View style={styles.headerControls}>
                                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
                                        <Icon name="chevron-left" size={24} color="#666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setViewDate(new Date())} style={styles.arrowBtn}>
                                        <View style={styles.todayDot} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
                                        <Icon name="chevron-right" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Body Content */}
                        {mode === 'DATE' ? (
                            <>
                                <View style={styles.weekDaysRow}>
                                    {weekDays.map((d, i) => (
                                        <Text key={i} style={styles.weekDayText}>{d}</Text>
                                    ))}
                                </View>

                                <View style={styles.grid}>
                                    {grid.map((item) => {
                                        if (!item.day || !item.fullDate) {
                                            return <View key={item.id} style={styles.dayCell} />;
                                        }

                                        const isSelected = isSameDay(item.fullDate, currentValid);
                                        const isToday = isSameDay(item.fullDate, new Date());

                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                                                onPress={() => handleDateSelect(item.fullDate!)}
                                            >
                                                <Text style={[
                                                    styles.dayText,
                                                    isSelected && styles.selectedDayText,
                                                    !isSelected && isToday && styles.todayText
                                                ]}>
                                                    {item.day}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        ) : (
                            renderClockFace()
                        )}

                        {/* Footer / Switcher */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.modeButton, mode === 'TIME' && styles.activeModeButton]}
                                onPress={() => setMode(mode === 'DATE' ? 'TIME' : 'DATE')}
                            >
                                <MaterialCommunityIcons
                                    name={mode === 'DATE' ? "clock-outline" : "calendar-month"}
                                    size={20}
                                    color="#555"
                                />
                                <Text style={styles.modeButtonText}>
                                    {mode === 'DATE' ? 'Time' : 'Date'}
                                    <Text style={styles.currentTimeText}>
                                        {`  ${(currentValid.getHours() % 12 || 12)}:${currentValid.getMinutes().toString().padStart(2, '0')} ${currentValid.getHours() >= 12 ? 'PM' : 'AM'}`}
                                    </Text>
                                </Text>
                                <Icon name="chevron-right" size={20} color="#999" style={styles.modeArrow} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
};

// ----------------------------------------------------------------------
// 7. STYLES
// ----------------------------------------------------------------------

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: CALENDAR_WIDTH,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        paddingBottom: 24,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowBtn: {
        padding: 8,
    },
    todayDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#666',
        backgroundColor: 'transparent',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    weekDayText: {
        width: DAY_SIZE,
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        fontWeight: '500',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: DAY_SIZE,
        height: DAY_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        borderRadius: DAY_SIZE / 2,
    },
    selectedDayCell: {
        backgroundColor: '#4285F4',
    },
    dayText: {
        fontSize: 14,
        color: '#333',
    },
    selectedDayText: {
        color: 'white',
        fontWeight: '600',
    },
    todayText: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    activeModeButton: {
        backgroundColor: '#E3F2FD',
    },
    modeButtonText: {
        marginLeft: 8,
        marginRight: 4,
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
    currentTimeText: {
        color: '#666',
        fontWeight: 'normal',
    },
    modeArrow: {
        marginLeft: 4,
    },
    doneButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    doneButtonText: {
        color: '#4285F4',
        fontWeight: '600',
        fontSize: 16,
    },
    // Clock Styles
    clockContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    amPmContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        padding: 2,
    },
    amPmButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    amPmSelected: {
        backgroundColor: 'white',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
    },
    amPmText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    amPmTextSelected: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
    timeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    digitalTimeText: {
        fontSize: 40,
        fontWeight: '300',
        color: '#333',
    },
    activeTimeText: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
    digitalTimeSeparator: {
        fontSize: 40,
        fontWeight: '300',
        color: '#333',
        marginHorizontal: 5,
        marginBottom: 5,
    },
    clockFace: {
        width: CLOCK_RADIUS * 2,
        height: CLOCK_RADIUS * 2,
        borderRadius: CLOCK_RADIUS,
        backgroundColor: '#F5F5F5',
        position: 'relative',
        marginBottom: 10,
    },
    centerDot: {
        position: 'absolute',
        top: CLOCK_CENTER - 4,
        left: CLOCK_CENTER - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4285F4',
        zIndex: 2,
    },
    clockHandContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: CLOCK_RADIUS * 2,
        height: CLOCK_RADIUS * 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    clockHandLine: {
        width: 2,
        height: CLOCK_RADIUS - 30,
        backgroundColor: '#4285F4',
        position: 'absolute',
        bottom: CLOCK_CENTER,
        left: CLOCK_CENTER - 1,
    },
    clockHandCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4285F4',
        position: 'absolute',
        top: 15,
        left: CLOCK_CENTER - 15,
    },
    clockNumber: {
        position: 'absolute',
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    clockNumberText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    selectedClockNumberText: {
        color: 'white',
        fontWeight: 'bold',
    },
    touchOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
});
