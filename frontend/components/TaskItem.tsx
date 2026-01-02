
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface Task {
    id: string;
    title: string;
    dueDate: Date;
    isCompleted: boolean;
    priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description?: string;
    subTasks?: { id: string; title: string; completed: boolean }[];
}

interface TaskItemProps {
    task: Task;
    onPress?: () => void;
    onToggleComplete?: () => void;
}

export const TaskItem = ({ task, onPress, onToggleComplete }: TaskItemProps) => {
    const [timeDisplay, setTimeDisplay] = useState('');
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const diff = task.dueDate.getTime() - now.getTime();
            const absDiff = Math.abs(diff);

            const isPast = diff < 0;
            setIsOverdue(isPast && !task.isCompleted);

            const minutes = Math.floor(absDiff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const years = Math.floor(days / 365);

            let text = '';
            if (years > 0) {
                text = `${years} y`;
            } else if (days > 0) {
                text = `${days} d`;
            } else if (hours > 0) {
                text = `${hours} h`;
            } else if (minutes > 0) {
                text = `${minutes} m`;
            } else {
                text = 'Now';
            }

            setTimeDisplay(text);
        };

        updateTime();
        // Update every minute to keep relative time fresh
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [task.dueDate, task.isCompleted]);


    return (
        <TouchableOpacity
            style={[styles.container, task.isCompleted && styles.containerCompleted]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <TouchableOpacity
                style={[styles.checkbox, task.isCompleted && styles.checkboxCompleted]}
                onPress={onToggleComplete}
            >
                {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={[styles.title, task.isCompleted && styles.titleCompleted]}>
                    {task.title}
                </Text>
            </View>

            <View style={styles.metaContainer}>
                <Text style={[
                    styles.time,
                    isOverdue ? styles.overdueText : styles.futureText,
                    task.isCompleted && styles.completedTime
                ]}>
                    {timeDisplay}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    containerCompleted: {
        backgroundColor: '#F9F9F9',
        opacity: 0.8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxCompleted: {
        backgroundColor: '#BDBDBD', // Greyed out
        borderColor: '#BDBDBD',
    },
    checkmark: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    titleCompleted: {
        color: '#AAA',
        textDecorationLine: 'line-through',
    },
    metaContainer: {
        marginLeft: 10,
        minWidth: 50,
        alignItems: 'flex-end',
    },
    time: {
        fontSize: 12,
        fontWeight: '600',
    },
    futureText: {
        color: '#666',
    },
    overdueText: {
        color: '#F44336', // Red
    },
    completedTime: {
        color: '#AAA', // Grey for completed
    }
});
