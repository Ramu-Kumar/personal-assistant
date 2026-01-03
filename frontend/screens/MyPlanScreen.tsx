import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Alert, Animated, Dimensions, BackHandler, AppState, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { TaskItem } from '../components/TaskItem';
import { CustomDatePicker } from '../components/CustomDatePicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTaskContext, Task } from '../context/TaskContext';
import { launchCamera } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TabButton = ({ title, isActive, onPress, count }: { title: string, isActive: boolean, onPress: () => void, count: number }) => (
    <TouchableOpacity
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
        {count > 0 && (
            <View style={[styles.badge, isActive && styles.activeBadge]}>
                <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>{count}</Text>
            </View>
        )}
    </TouchableOpacity>
);

interface MyPlanScreenProps {
    navigation: {
        openDrawer: () => void;
        navigate: (screen: string) => void;
    };
}

export function MyPlanScreen({ navigation }: MyPlanScreenProps) {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'Overdue' | 'Today' | 'Later'>('Today');

    // Context
    const { tasks, addTask, updateTask, deleteTask: deleteTaskContext, toggleTaskCompletion, refreshTasks } = useTaskContext();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refreshTasks();
        setRefreshing(false);
    }, [refreshTasks]);

    // Animation State
    const [renderModal, setRenderModal] = useState(false);
    const renderModalRef = useRef(false);

    // Sync ref when state changes
    useEffect(() => {
        renderModalRef.current = renderModal;
    }, [renderModal]);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Form State
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState(new Date());
    const [priority, setPriority] = useState<'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('NONE');
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);
    const [subTasks, setSubTasks] = useState<{ id: string, title: string; completed: boolean }[]>([]);

    // Advanced Task Creation State
    const [creationMode, setCreationMode] = useState<'MANUAL' | 'LEARNING' | 'LOAN' | 'MEETING'>('MANUAL');
    const [showTypeSelection, setShowTypeSelection] = useState(false);

    // Read-Only & Menu State
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Learning Mode Inputs
    const [totalVideos, setTotalVideos] = useState('');
    const [completedVideos, setCompletedVideos] = useState('');

    // Loan Mode Inputs
    const [loanAmount, setLoanAmount] = useState('');
    const [loanOutstanding, setLoanOutstanding] = useState('');
    const [loanInterestRate, setLoanInterestRate] = useState('');
    const [loanEmi, setLoanEmi] = useState('');

    // Meeting Mode Inputs
    const [meetingStartTime, setMeetingStartTime] = useState(new Date());
    const [meetingEndTime, setMeetingEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
    const [meetingInfo, setMeetingInfo] = useState('');
    const [meetingLink, setMeetingLink] = useState('');



    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    // For 3-dot menu

    // Handle Hardware Back Button
    useEffect(() => {
        const backAction = () => {
            if (renderModalRef.current) {
                closeModal();
                return true; // Stop default behavior (exit app)
            }
            return false; // Allow default behavior
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, []);

    // Handle App State Changes - Close modal when app is backgrounded
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                if (renderModalRef.current) {
                    setRenderModal(false);
                    renderModalRef.current = false;
                    slideAnim.setValue(SCREEN_HEIGHT);
                    fadeAnim.setValue(0);
                    resetForm();
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const openModal = () => {
        setRenderModal(true);
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
    };

    const handleFabPress = () => {
        if (editingTaskId) {
            // If somehow we have an editing ID, just open modal directly (edge case)
            openModal();
        } else {
            setShowTypeSelection(true);
        }
    };

    const startCreation = (mode: 'MANUAL' | 'LEARNING' | 'LOAN' | 'MEETING') => {
        setCreationMode(mode);
        setShowTypeSelection(false);
        setIsReadOnly(false); // New tasks are editable
        setShowMenu(false);
        // Reset specific fields
        setTotalVideos('');
        setCompletedVideos('');
        setLoanAmount('');
        setLoanOutstanding('');
        setLoanInterestRate('');
        setLoanEmi('');
        setMeetingStartTime(new Date());
        setMeetingEndTime(new Date(Date.now() + 60 * 60 * 1000));
        setMeetingInfo('');
        setMeetingLink('');

        openModal();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setRenderModal(false);
            resetForm();
        });
    };

    const saveTask = async () => {
        // Auto-generate title if empty for specialized modes
        let titleToSave = newTaskTitle.trim();
        if (!titleToSave) {
            if (creationMode === 'LEARNING' && (totalVideos || completedVideos)) {
                titleToSave = "Learning Goal";
            } else if (creationMode === 'LOAN' && (loanAmount || loanEmi)) {
                titleToSave = "Loan / EMI";
            } else if (creationMode === 'MEETING') {
                titleToSave = "Meeting";
            } else {
                return; // Manual mode requires explicit title
            }
        }

        const validSubTasks = subTasks.filter(st => st.title.trim().length > 0).map(({ title, completed }) => ({ title, completed }));

        let description = "";

        if (creationMode === 'LEARNING') {
            const total = parseInt(totalVideos) || 0;
            const completed = parseInt(completedVideos) || 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            description = `Progress: ${completed}/${total} videos (${percentage}%)`;
        } else if (creationMode === 'LOAN') {
            // Enhanced EMI Calculator
            const principal = parseFloat(loanAmount) || 0;
            const outstanding = parseFloat(loanOutstanding) || 0;
            const annualRate = parseFloat(loanInterestRate) || 0;
            const emi = parseFloat(loanEmi) || 0;

            // Calculate monthly interest rate
            const monthlyRate = annualRate / 12 / 100;

            // Calculate tenure pending
            let tenurePending = 0;
            if (emi > 0 && monthlyRate > 0 && outstanding > 0) {
                tenurePending = Math.ceil(
                    Math.log(emi / (emi - outstanding * monthlyRate)) / Math.log(1 + monthlyRate)
                );
            }

            // Calculate totals
            const totalPayable = emi * tenurePending;
            const totalInterest = totalPayable - outstanding;
            const totalPrincipal = outstanding;

            description = `Loan: ${principal} | Outstanding: ${outstanding} | Rate: ${annualRate}% | EMI: ${emi}\nTenure: ${tenurePending}m | Principal: ${totalPrincipal} | Interest: ${totalInterest.toFixed(2)}`;
        } else if (creationMode === 'MEETING') {
            const startTime = meetingStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = meetingEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const durationMs = meetingEndTime.getTime() - meetingStartTime.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            description = `Meeting: ${startTime} - ${endTime} (${duration})`;
        }

        const taskData = {
            title: titleToSave,
            completed: false,
            dueDate: newTaskDate.toISOString(),
            priority: priority,
            subTasks: validSubTasks,
            description: description,
            taskType: creationMode,
            // Learning fields
            totalVideos: creationMode === 'LEARNING' ? (parseInt(totalVideos) || null) : null,
            completedVideos: creationMode === 'LEARNING' ? (parseInt(completedVideos) || null) : null,
            // Loan fields
            loanAmount: creationMode === 'LOAN' ? (parseFloat(loanAmount) || null) : null,
            loanOutstanding: creationMode === 'LOAN' ? (parseFloat(loanOutstanding) || null) : null,
            loanInterestRate: creationMode === 'LOAN' ? (parseFloat(loanInterestRate) || null) : null,
            loanEmi: creationMode === 'LOAN' ? (parseFloat(loanEmi) || null) : null,
            // Meeting fields
            meetingStartTime: creationMode === 'MEETING' ? meetingStartTime.toISOString() : null,
            meetingEndTime: creationMode === 'MEETING' ? meetingEndTime.toISOString() : null,
            meetingInfo: creationMode === 'MEETING' ? (meetingInfo || null) : null,
            meetingLink: creationMode === 'MEETING' ? (meetingLink || null) : null,
        };

        // Optimistically close modal to prevent delay
        closeModal();

        try {
            let success = false;
            if (editingTaskId) {
                const existingTask = tasks.find(t => t.id === editingTaskId);
                if (existingTask) {
                    (taskData as any).completed = existingTask.isCompleted;
                }
                success = await updateTask(editingTaskId, taskData);
            } else {
                success = await addTask(taskData);
            }

            if (!success) {
                Alert.alert("Sync Error", "Could not save task to server.");
            }
        } catch (error) {
            console.error("Save task failed", error);
            Alert.alert("Error", "An unexpected error occurred.");
        }
    };

    const handleDeleteTask = () => {
        if (!editingTaskId) return;

        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteTaskContext(editingTaskId);
                        if (success) {
                            closeModal();
                        } else {
                            Alert.alert("Error", "Failed to delete task.");
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = (task: Task) => {
        setEditingTaskId(task.id);
        setNewTaskTitle(task.title);
        setNewTaskDate(new Date(task.dueDate));
        setPriority(task.priority || 'NONE');
        setSubTasks(task.subTasks ? task.subTasks.map((st: any) => ({
            id: st.id || Math.random().toString(36).substr(2, 9),
            title: st.title,
            completed: st.completed
        })) : []);

        // Parse Description to restore Mode and Inputs
        // Prefer structured fields if available (new format), fallback to parsing description (old format)
        const taskType: 'MANUAL' | 'LEARNING' | 'LOAN' | 'MEETING' = task.taskType || (task.description?.includes("Progress:") ? 'LEARNING' : task.description?.includes("Loan:") ? 'LOAN' : task.description?.includes("Meeting:") ? 'MEETING' : 'MANUAL');

        if (taskType === 'LEARNING') {
            setCreationMode('LEARNING');
            setIsReadOnly(true);

            // Use structured fields if available
            if (task.totalVideos !== undefined && task.completedVideos !== undefined) {
                setTotalVideos(task.totalVideos.toString());
                setCompletedVideos(task.completedVideos.toString());
            } else {
                // Fallback to parsing description
                const desc = task.description || "";
                const match = desc.match(/Progress:\s*(\d+)\/(\d+)/);
                if (match) {
                    setCompletedVideos(match[1]);
                    setTotalVideos(match[2]);
                }
            }
        } else if (taskType === 'LOAN') {
            setCreationMode('LOAN');
            setIsReadOnly(true);

            // Use structured fields if available
            if (task.loanAmount !== undefined) {
                setLoanAmount(task.loanAmount.toString());
                setLoanOutstanding((task.loanOutstanding || 0).toString());
                setLoanInterestRate((task.loanInterestRate || 0).toString());
                setLoanEmi((task.loanEmi || 0).toString());
            } else {
                // Fallback to parsing description
                const desc = task.description || "";
                const loanMatch = desc.match(/Loan:\s*([\d.]+)/);
                const outMatch = desc.match(/Outstanding:\s*([\d.]+)/);
                const rateMatch = desc.match(/Rate:\s*([\d.]+)/);
                const emiMatch = desc.match(/EMI:\s*([\d.]+)/);

                if (loanMatch) setLoanAmount(loanMatch[1]);
                if (outMatch) setLoanOutstanding(outMatch[1]);
                if (rateMatch) setLoanInterestRate(rateMatch[1]);
                if (emiMatch) setLoanEmi(emiMatch[1]);
            }
        } else if (taskType === 'MEETING') {
            setCreationMode('MEETING');
            setIsReadOnly(true);

            // Use structured fields if available
            if (task.meetingStartTime && task.meetingEndTime) {
                setMeetingStartTime(new Date(task.meetingStartTime));
                setMeetingEndTime(new Date(task.meetingEndTime));
                setMeetingInfo(task.meetingInfo || '');
                setMeetingLink(task.meetingLink || '');
            }
        } else {
            setCreationMode('MANUAL');
        }

        openModal();
    };

    const resetForm = () => {
        setEditingTaskId(null);
        setNewTaskTitle('');
        setNewTaskDate(new Date());
        setPriority('NONE');
        setShowPriorityPicker(false);
        setSubTasks([]);
        setShowMenu(false);
        setCreationMode('MANUAL'); // Reset mode
        setIsReadOnly(false); // Reset read-only
        setTotalVideos('');
        setCompletedVideos('');
        setLoanAmount('');
        setLoanOutstanding('');
        setLoanInterestRate('');
        setLoanEmi('');
        setMeetingStartTime(new Date());
        setMeetingEndTime(new Date(Date.now() + 60 * 60 * 1000));
        setMeetingInfo('');
        setMeetingLink('');
    };

    const addSubTask = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        setSubTasks([...subTasks, { id: newId, title: '', completed: false }]);
    };

    const updateSubTask = (text: string, id: string) => {
        setSubTasks(prev => prev.map(st => st.id === id ? { ...st, title: text } : st));
    };

    const removeSubTask = (id: string) => {
        setSubTasks(prev => prev.filter(st => st.id !== id));
    };

    const toggleSubTask = (id: string) => {
        setSubTasks(prev => prev.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
    };

    const handleGoogleCalendarImport = async () => {
        try {
            Alert.alert(
                "Import from Google Calendar",
                "This will open Google Calendar authentication and import your upcoming meetings.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Continue",
                        onPress: async () => {
                            // TODO: Implement Google OAuth flow
                            // 1. Open Google OAuth URL
                            // 2. Get authorization code
                            // 3. Exchange for access token
                            // 4. Fetch calendar events
                            // 5. Parse and populate meeting fields
                            Alert.alert("Coming Soon", "Google Calendar integration will be available soon!");
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Google Calendar import error:", error);
            Alert.alert("Error", "Failed to import from Google Calendar");
        }
    };

    const handleTeamsCalendarImport = async () => {
        try {
            Alert.alert(
                "Import from Teams Calendar",
                "This will open Microsoft authentication and import your upcoming Teams meetings.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Continue",
                        onPress: async () => {
                            // TODO: Implement Microsoft OAuth flow
                            // 1. Open Microsoft OAuth URL
                            // 2. Get authorization code
                            // 3. Exchange for access token
                            // 4. Fetch calendar events from Microsoft Graph API
                            // 5. Parse and populate meeting fields
                            Alert.alert("Coming Soon", "Teams Calendar integration will be available soon!");
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Teams Calendar import error:", error);
            Alert.alert("Error", "Failed to import from Teams Calendar");
        }
    };

    const handleScanMeetingDetails = async () => {
        try {
            Alert.alert(
                "Scan Meeting Details",
                "Choose how you want to scan the meeting details:",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Scan Text (OCR)",
                        onPress: async () => {
                            const result = await launchCamera({
                                mediaType: 'photo',
                                includeBase64: false,
                                saveToPhotos: false,
                            });

                            if (result.assets && result.assets[0]?.uri) {
                                try {
                                    const imageUri = result.assets[0].uri;
                                    const recognizedText = await TextRecognition.recognize(imageUri);

                                    if (recognizedText.text) {
                                        processScannedText(recognizedText.text);
                                    } else {
                                        Alert.alert("No Text Found", "Could not recognize any text in the image.");
                                    }
                                } catch (err) {
                                    console.error("OCR Error:", err);
                                    Alert.alert("OCR Error", "Failed to process image text.");
                                }
                            }
                        }
                    },
                    {
                        text: "Scan QR Code",
                        onPress: () => {
                            // TODO: Implement QR scanning
                            Alert.alert("Coming Soon", "QR scanning will be available soon!");
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Scanning error:", error);
            Alert.alert("Error", "Failed to initiate scanning");
        }
    };

    const processScannedText = (text: string) => {
        // Simple heuristic parsing
        const lines = text.split('\n');
        let titleFound = "";
        let linkFound = "";
        let descriptionValues: string[] = [];

        // Regex patterns
        const timePattern = /(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i;
        const datePattern = /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})|(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/; // MM/DD/YYYY or YYYY-MM-DD
        const urlPattern = /(https?:\/\/[^\s]+)/g;

        // Reset times for parsing
        let startTimeSet = false;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Look for URL
            const urlMatch = trimmed.match(urlPattern);
            if (urlMatch) {
                linkFound = urlMatch[0];
            }

            // Look for Date
            const dateMatch = trimmed.match(datePattern);
            if (dateMatch) {
                // Try to parse date
                const parsedDate = new Date(dateMatch[0]);
                if (!isNaN(parsedDate.getTime())) {
                    setNewTaskDate(parsedDate);
                }
            }

            // Look for Time (Start - End)
            if (!startTimeSet) {
                const timeMatch = trimmed.match(timePattern);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const period = timeMatch[3]?.toUpperCase();

                    let date = new Date(newTaskDate); // Use currently selected date
                    let adjustedHours = hours;

                    if (period === 'PM' && hours < 12) adjustedHours += 12;
                    if (period === 'AM' && hours === 12) adjustedHours = 0;

                    date.setHours(adjustedHours, minutes, 0, 0);

                    if (!isNaN(date.getTime())) {
                        setMeetingStartTime(date);
                        // Default end time to 1 hour later
                        setMeetingEndTime(new Date(date.getTime() + 60 * 60 * 1000));
                        startTimeSet = true;
                    }
                }
            }

            // Heuristic for Title: First non-date, non-link line that is reasonably long and doesn't look like an artifact
            // Skip common calendar words
            const skipWords = ["Join", "Meeting", "Invite", "Zoom", "Teams", "Google", "Link", "Time", "Date", "When", "Where"];
            const startsWithSkipWord = skipWords.some(word => trimmed.toLowerCase().startsWith(word.toLowerCase()));

            if (!titleFound && trimmed.length > 5 && !trimmed.match(urlPattern) && !trimmed.match(datePattern) && !trimmed.match(timePattern) && !startsWithSkipWord) {
                titleFound = trimmed;
            } else {
                descriptionValues.push(trimmed);
            }
        });

        // Populate Fields
        setCreationMode('MEETING');
        if (titleFound) setNewTaskTitle(titleFound);
        if (linkFound) setMeetingLink(linkFound);

        // Populate info with all text found so user can verify
        setMeetingInfo(text);

        Alert.alert("Scanned!", "Meeting details scanned. Please review and adjust extracted info.");
    };

    const categorizedTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdue: Task[] = [];
        const todayTasks: Task[] = [];
        const later: Task[] = [];

        tasks.forEach(task => {
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);

            if (taskDate < today) {
                overdue.push(task);
            } else if (taskDate.getTime() === today.getTime()) {
                todayTasks.push(task);
            } else {
                later.push(task);
            }
        });

        const sortTasks = (a: Task, b: Task) => {
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            return a.dueDate.getTime() - b.dueDate.getTime();
        };

        return {
            Overdue: overdue.sort(sortTasks),
            Today: todayTasks.sort(sortTasks),
            Later: later.sort(sortTasks),
        };
    }, [tasks]);

    const sortedSubTasks = useMemo(() => {
        return [...subTasks].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });
    }, [subTasks]);

    useEffect(() => {
        const currentCount = categorizedTasks[activeTab].length;
        if (currentCount === 0) {
            const tabs: ('Overdue' | 'Today' | 'Later')[] = ['Overdue', 'Today', 'Later'];
            const firstNotEmpty = tabs.find(t => categorizedTasks[t].length > 0);
            if (firstNotEmpty && firstNotEmpty !== activeTab) {
                setActiveTab(firstNotEmpty);
            }
        }
    }, [categorizedTasks, activeTab]);


    const toggleTask = (id: string, currentStatus: boolean, currentTitle: string, currentDueDate: Date, currentPriority: any, currentDescription: string, currentSubTasks: any) => {
        toggleTaskCompletion(id, currentStatus, currentTitle, currentDueDate, currentPriority, currentDescription, currentSubTasks);
    };

    const handleDatePress = () => {
        setShowCustomDatePicker(true);
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'CRITICAL': return '#F44336'; // Red
            case 'HIGH': return '#E91E63'; // Pink
            case 'MEDIUM': return '#FBC02D'; // Yellow/Orange-ish
            case 'LOW': return '#4CAF50'; // Green
            default: return '#757575'; // Grey
        }
    };

    const getPriorityLabel = (p: string) => {
        switch (p) {
            case 'CRITICAL': return 'Critical';
            case 'HIGH': return 'High';
            case 'MEDIUM': return 'Medium';
            case 'LOW': return 'Low';
            case 'NONE': return 'None';
            default: return '';
        }
    };

    const PriorityOption = ({ level, color }: { level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', color: string }) => (
        <TouchableOpacity
            style={[styles.priorityOption, priority === level && styles.selectedPriority]}
            onPress={() => { setPriority(level); setShowPriorityPicker(false); }}
        >
            <Icon name="flag" size={24} color={color} />
            <Text style={[styles.priorityLabel, { color: color }]}>{getPriorityLabel(level)}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header onMenuPress={navigation.openDrawer} />

            <View style={styles.tabContainer}>
                {categorizedTasks.Overdue.length > 0 && (
                    <TabButton title="Overdue" isActive={activeTab === 'Overdue'} onPress={() => setActiveTab('Overdue')} count={categorizedTasks.Overdue.length} />
                )}
                {categorizedTasks.Today.length > 0 && (
                    <TabButton title="Today" isActive={activeTab === 'Today'} onPress={() => setActiveTab('Today')} count={categorizedTasks.Today.length} />
                )}
                {categorizedTasks.Later.length > 0 && (
                    <TabButton title="Later" isActive={activeTab === 'Later'} onPress={() => setActiveTab('Later')} count={categorizedTasks.Later.length} />
                )}
            </View>

            <View style={styles.content}>
                <FlatList
                    data={categorizedTasks[activeTab]}
                    extraData={tasks}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TaskItem
                            task={item}
                            onToggleComplete={() => toggleTask(item.id, item.isCompleted, item.title, item.dueDate, item.priority, item.description || "", item.subTasks)}
                            onPress={() => openEditModal(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No tasks for {activeTab}</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            </View>

            <TouchableOpacity style={[styles.fab, { bottom: 20 + insets.bottom }]} onPress={handleFabPress}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Custom Animated Modal */}
            {renderModal && (
                <View style={styles.modalOverlay} pointerEvents="box-none">
                    <TouchableWithoutFeedback onPress={closeModal}>
                        <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
                    </TouchableWithoutFeedback>
                    <Animated.View
                        style={[
                            styles.modalView,
                            {
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={handleDatePress} style={styles.dateSelector}>
                                <Icon name="event" size={20} color="#2196F3" />
                                <Text style={styles.dateSelectorText}>
                                    {newTaskDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.headerRight}>
                                <TouchableOpacity onPress={() => setShowPriorityPicker(!showPriorityPicker)} style={styles.flagButton}>
                                    <Icon name="flag" size={24} color={getPriorityColor(priority)} />
                                </TouchableOpacity>

                                {editingTaskId && (
                                    <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
                                        <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                    <Icon name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Three-dot Menu Dropdown */}
                        {showMenu && editingTaskId && (
                            <>
                                <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                                    <View style={styles.menuOverlay} />
                                </TouchableWithoutFeedback>
                                <View style={styles.menuDropdown}>
                                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                                        setIsReadOnly(false);
                                        setShowMenu(false);
                                    }}>
                                        <Text style={styles.menuItemTextBlue}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.menuItem} onPress={handleDeleteTask}>
                                        <Text style={styles.menuItemTextRed}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* Priority Picker */}
                        {showPriorityPicker && (
                            <View style={styles.priorityPickerContainer}>
                                <PriorityOption level="CRITICAL" color="#F44336" />
                                <PriorityOption level="HIGH" color="#E91E63" />
                                <PriorityOption level="MEDIUM" color="#FBC02D" />
                                <PriorityOption level="LOW" color="#4CAF50" />
                                <PriorityOption level="NONE" color="#757575" />
                            </View>
                        )}

                        <ScrollView style={styles.modalContent}>
                            {/* Title Input */}
                            <TextInput
                                style={[styles.titleInput, isReadOnly && styles.readOnlyText]}
                                placeholder={creationMode === 'LOAN' ? "Loan Name" : (creationMode === 'LEARNING' ? "Course Title" : "Task Title")}
                                value={newTaskTitle}
                                onChangeText={setNewTaskTitle}
                                placeholderTextColor="#999"
                                editable={!isReadOnly}
                            />

                            {/* Learning Mode Inputs */}
                            {creationMode === 'LEARNING' && (
                                <View style={styles.specialInputContainer}>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Total Videos</Text>
                                        <TextInput
                                            style={[styles.smallInput, isReadOnly && styles.readOnlyInput]}
                                            keyboardType="numeric"
                                            value={totalVideos}
                                            onChangeText={setTotalVideos}
                                            placeholder="0"
                                            editable={!isReadOnly}
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Completed</Text>
                                        <TextInput
                                            style={[styles.smallInput, isReadOnly && styles.readOnlyInput]}
                                            keyboardType="numeric"
                                            value={completedVideos}
                                            onChangeText={setCompletedVideos}
                                            placeholder="0"
                                            editable={!isReadOnly}
                                        />
                                    </View>
                                    <View style={styles.progressSummary}>
                                        <Text style={styles.progressLabel}>Progress:</Text>
                                        <Text style={styles.progressValue}>
                                            {totalVideos && parseInt(totalVideos) > 0 ? Math.round((parseInt(completedVideos || '0') / parseInt(totalVideos)) * 100) : 0}%
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Loan Mode Inputs */}
                            {creationMode === 'LOAN' && (
                                <View style={styles.specialInputContainer}>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Loan Amount</Text>
                                        <View style={styles.inputWithSymbol}>
                                            <Text style={styles.currencySymbol}>₹</Text>
                                            <TextInput
                                                style={[styles.smallInputWithSymbol, isReadOnly && styles.readOnlyInput]}
                                                keyboardType="numeric"
                                                value={loanAmount}
                                                onChangeText={setLoanAmount}
                                                placeholder="0.00"
                                                editable={!isReadOnly}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Outstanding Amount</Text>
                                        <View style={styles.inputWithSymbol}>
                                            <Text style={styles.currencySymbol}>₹</Text>
                                            <TextInput
                                                style={[styles.smallInputWithSymbol, isReadOnly && styles.readOnlyInput]}
                                                keyboardType="numeric"
                                                value={loanOutstanding}
                                                onChangeText={setLoanOutstanding}
                                                placeholder="0.00"
                                                editable={!isReadOnly}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Interest Rate</Text>
                                        <View style={styles.inputWithSymbol}>
                                            <TextInput
                                                style={[styles.smallInputWithSymbol, isReadOnly && styles.readOnlyInput]}
                                                keyboardType="numeric"
                                                value={loanInterestRate}
                                                onChangeText={setLoanInterestRate}
                                                placeholder="0.00"
                                                editable={!isReadOnly}
                                            />
                                            <Text style={styles.percentSymbol}>%</Text>
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>EMI Amount</Text>
                                        <View style={styles.inputWithSymbol}>
                                            <Text style={styles.currencySymbol}>₹</Text>
                                            <TextInput
                                                style={[styles.smallInputWithSymbol, isReadOnly && styles.readOnlyInput]}
                                                keyboardType="numeric"
                                                value={loanEmi}
                                                onChangeText={setLoanEmi}
                                                placeholder="0.00"
                                                editable={!isReadOnly}
                                            />
                                        </View>
                                    </View>
                                    {/* Calculated Fields */}
                                    {(() => {
                                        const outstanding = parseFloat(loanOutstanding) || 0;
                                        const annualRate = parseFloat(loanInterestRate) || 0;
                                        const emi = parseFloat(loanEmi) || 0;
                                        const monthlyRate = annualRate / 12 / 100;

                                        let tenurePending = 0;
                                        if (emi > 0 && monthlyRate > 0 && outstanding > 0) {
                                            tenurePending = Math.ceil(
                                                Math.log(emi / (emi - outstanding * monthlyRate)) / Math.log(1 + monthlyRate)
                                            );
                                        }

                                        const totalPayable = emi * tenurePending;
                                        const totalInterest = totalPayable - outstanding;

                                        return (
                                            <>
                                                <View style={styles.progressSummary}>
                                                    <Text style={styles.progressLabel}>Tenure Pending:</Text>
                                                    <Text style={styles.progressValue}>{tenurePending} months</Text>
                                                </View>
                                                <View style={styles.progressSummary}>
                                                    <Text style={styles.progressLabel}>Total Principal:</Text>
                                                    <Text style={styles.progressValue}>₹{outstanding.toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.progressSummary}>
                                                    <Text style={styles.progressLabel}>Total Interest:</Text>
                                                    <Text style={styles.progressValue}>₹{totalInterest.toFixed(2)}</Text>
                                                </View>
                                            </>
                                        );
                                    })()}
                                </View>
                            )}

                            {/* Meeting Mode Inputs */}
                            {creationMode === 'MEETING' && (
                                <View style={styles.specialInputContainer}>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Start Time</Text>
                                        <TouchableOpacity
                                            style={styles.timePickerButton}
                                            onPress={() => {
                                                // TODO: Implement time picker for start time
                                                Alert.alert('Time Picker', 'Start time picker will be implemented');
                                            }}
                                            disabled={isReadOnly}
                                        >
                                            <Icon name="access-time" size={20} color={isReadOnly ? "#BBB" : "#2196F3"} />
                                            <Text style={[styles.timePickerText, isReadOnly && styles.readOnlyText]}>
                                                {meetingStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>End Time</Text>
                                        <TouchableOpacity
                                            style={styles.timePickerButton}
                                            onPress={() => {
                                                // TODO: Implement time picker for end time
                                                Alert.alert('Time Picker', 'End time picker will be implemented');
                                            }}
                                            disabled={isReadOnly}
                                        >
                                            <Icon name="access-time" size={20} color={isReadOnly ? "#BBB" : "#2196F3"} />
                                            <Text style={[styles.timePickerText, isReadOnly && styles.readOnlyText]}>
                                                {meetingEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.progressSummary}>
                                        <Text style={styles.progressLabel}>Duration:</Text>
                                        <Text style={styles.progressValue}>
                                            {(() => {
                                                const durationMs = meetingEndTime.getTime() - meetingStartTime.getTime();
                                                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                                                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                                                return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                                            })()}
                                        </Text>
                                    </View>

                                    <View style={styles.meetingInfoContainer}>
                                        <Text style={styles.inputLabel}>Meeting Info</Text>
                                        <TextInput
                                            style={[styles.meetingInfoInput, isReadOnly && styles.readOnlyInput]}
                                            multiline
                                            numberOfLines={4}
                                            value={meetingInfo}
                                            onChangeText={setMeetingInfo}
                                            placeholder="Add agenda, notes, or other details..."
                                            editable={!isReadOnly}
                                            textAlignVertical="top"
                                        />
                                    </View>

                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Meeting Link (Optional)</Text>
                                        <TextInput
                                            style={[styles.smallInput, isReadOnly && styles.readOnlyInput]}
                                            value={meetingLink}
                                            onChangeText={setMeetingLink}
                                            placeholder="https://meet.google.com/..."
                                            editable={!isReadOnly}
                                            keyboardType="url"
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    {/* Calendar Import Section */}
                                    {!editingTaskId && (
                                        <View style={styles.calendarImportContainer}>
                                            <Text style={styles.calendarImportTitle}>Import / Scan</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarButtonsRow}>
                                                <TouchableOpacity
                                                    style={styles.calendarButton}
                                                    onPress={handleGoogleCalendarImport}
                                                >
                                                    <Icon name="event" size={20} color="#4285F4" />
                                                    <Text style={styles.calendarButtonText}>Google</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.calendarButton}
                                                    onPress={handleTeamsCalendarImport}
                                                >
                                                    <MaterialCommunityIcons name="microsoft-teams" size={20} color="#5558AF" />
                                                    <Text style={styles.calendarButtonText}>Teams</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.calendarButton}
                                                    onPress={handleScanMeetingDetails}
                                                >
                                                    <MaterialCommunityIcons name="camera-plus" size={20} color="#E91E63" />
                                                    <Text style={styles.calendarButtonText}>Scan</Text>
                                                </TouchableOpacity>
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Subtasks List - Only for Manual Mode (Optional for others?) */}
                            {/* User requested Manual follows current procedure, so keeping subtasks for all modes or just manual? */}
                            {/* Assuming subtasks are generic and useful for all, but emphasizing manual */}

                            {/* Subtasks List */}
                            {sortedSubTasks.map((sub, index) => (
                                <View key={sub.id} style={[styles.subTaskItem, sub.completed && styles.subTaskCompleted]}>
                                    <TouchableOpacity onPress={() => toggleSubTask(sub.id)} disabled={isReadOnly}>
                                        <MaterialCommunityIcons
                                            name={sub.completed ? "checkbox-marked" : "checkbox-blank-outline"}
                                            size={24}
                                            color={(sub.completed || isReadOnly) ? "#BBB" : "#2196F3"}
                                        />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[styles.subTaskInput, sub.completed && styles.subTaskInputCompleted, isReadOnly && styles.readOnlyText]}
                                        value={sub.title}
                                        onChangeText={(text) => updateSubTask(text, sub.id)}
                                        placeholder="Subtask"
                                        placeholderTextColor="#CCC"
                                        editable={!sub.completed && !isReadOnly}
                                    />
                                    {!isReadOnly && (
                                        <TouchableOpacity onPress={() => removeSubTask(sub.id)}>
                                            <Icon name="delete" size={20} color="#999" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            {/* Add Subtask Button */}
                            {!isReadOnly && (
                                <TouchableOpacity style={styles.addSubTaskContainer} onPress={addSubTask}>
                                    <MaterialCommunityIcons name="plus" size={24} color="#666" />
                                    <Text style={styles.addSubTaskText}>Add subtask</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {/* Footer / Actions */}
                        {!isReadOnly && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.submitButton, (!newTaskTitle.trim() && creationMode === 'MANUAL') && { backgroundColor: '#CCC' }]}
                                    onPress={saveTask}
                                    disabled={!newTaskTitle.trim() && creationMode === 'MANUAL'}
                                >
                                    <Icon name="check" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </View>
            )}

            {/* Type Selection Modal */}
            <Modal
                visible={showTypeSelection}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTypeSelection(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTypeSelection(false)}
                >
                    <View style={styles.selectionCard}>
                        <Text style={styles.selectionTitle}>Create New</Text>

                        <TouchableOpacity style={styles.selectionItem} onPress={() => startCreation('MANUAL')}>
                            <Icon name="assignment" size={24} color="#2196F3" />
                            <View style={styles.selectionTextContainer}>
                                <Text style={styles.selectionItemTitle}>Manual Task</Text>
                                <Text style={styles.selectionItemSubtitle}>Create a standard to-do task</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.selectionItem} onPress={() => startCreation('LEARNING')}>
                            <Icon name="school" size={24} color="#4CAF50" />
                            <View style={styles.selectionTextContainer}>
                                <Text style={styles.selectionItemTitle}>Learning Goal</Text>
                                <Text style={styles.selectionItemSubtitle}>Track videos and course progress</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.selectionItem} onPress={() => startCreation('LOAN')}>
                            <Icon name="attach-money" size={24} color="#FF9800" />
                            <View style={styles.selectionTextContainer}>
                                <Text style={styles.selectionItemTitle}>Loan / EMI</Text>
                                <Text style={styles.selectionItemSubtitle}>Calculate finance and track EMI</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.selectionItem} onPress={() => startCreation('MEETING')}>
                            <Icon name="event" size={24} color="#9C27B0" />
                            <View style={styles.selectionTextContainer}>
                                <Text style={styles.selectionItemTitle}>Meeting</Text>
                                <Text style={styles.selectionItemSubtitle}>Schedule and track meetings</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {showCustomDatePicker && (
                <CustomDatePicker
                    visible={showCustomDatePicker}
                    onClose={() => setShowCustomDatePicker(false)}
                    value={newTaskDate}
                    onChange={(date) => setNewTaskDate(date)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#F0F0F0',
    },
    activeTab: {
        backgroundColor: '#E3F2FD',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#1976D2',
    },
    badge: {
        backgroundColor: '#CCC',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
    },
    activeBadge: {
        backgroundColor: '#BBDEFB',
    },
    badgeText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: 'bold',
    },
    activeBadgeText: {
        color: '#1976D2',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80, // Space for FAB
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 20,
        backgroundColor: '#1976D2',
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fabText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        height: '80%',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        zIndex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flagButton: {
        marginRight: 10,
    },
    closeButton: {
        padding: 4,
    },
    menuButton: {
        padding: 4,
    },
    menuDropdown: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 100,
        paddingVertical: 8,
        paddingHorizontal: 5,
        minWidth: 150,
    },
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    menuItemTextBlue: {
        color: '#2196F3', // Blue for Edit
        fontWeight: '500',
        fontSize: 16,
    },
    menuItemTextRed: {
        color: '#F44336', // Red for Delete
        fontWeight: '500',
        fontSize: 16,
    },
    readOnlyText: {
        color: '#333',
    },
    readOnlyInput: {
        backgroundColor: '#F0F0F0',
        color: '#555',
        borderColor: 'transparent',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateSelectorText: {
        marginLeft: 8,
        color: '#2196F3',
        fontWeight: '500',
    },
    priorityPickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#F9F9F9',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
    },
    priorityOption: {
        padding: 5,
        borderRadius: 5,
        alignItems: 'center',
    },
    selectedPriority: {
        backgroundColor: '#E0E0E0',
    },
    priorityLabel: {
        fontSize: 10,
        marginTop: 2,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
    },
    titleInput: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    subTaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    subTaskCompleted: {
        opacity: 0.6,
    },
    subTaskInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        padding: 0,
        color: '#333',
    },
    subTaskInputCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    addSubTaskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    addSubTaskText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 16,
    },
    modalFooter: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
        marginTop: 10,
        alignItems: 'flex-end',
    },
    submitButton: {
        backgroundColor: '#2196F3',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    // Selection Modal Styles
    selectionCard: {
        backgroundColor: 'white',
        width: '100%',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
    },
    selectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    selectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectionTextContainer: {
        marginLeft: 15,
    },
    selectionItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    selectionItemSubtitle: {
        fontSize: 12,
        color: '#888',
    },
    // Advanced Inputs
    specialInputContainer: {
        marginBottom: 20,
        backgroundColor: '#F9F9F9',
        padding: 10,
        borderRadius: 10,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        width: 100,
    },
    smallInput: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 14,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    progressDisplay: {
        padding: 15,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    progressText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    progressSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    progressLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    progressValue: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: 'bold',
    },
    inputWithSymbol: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 10,
    },
    smallInputWithSymbol: {
        flex: 1,
        paddingVertical: 6,
        fontSize: 14,
        color: '#333',
        borderWidth: 0,
    },
    currencySymbol: {
        fontSize: 14,
        color: '#666',
        marginRight: 5,
        fontWeight: '600',
    },
    percentSymbol: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
        fontWeight: '600',
    },
    timePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    timePickerText: {
        fontSize: 14,
        color: '#333',
    },
    meetingInfoContainer: {
        marginTop: 10,
    },
    meetingInfoInput: {
        backgroundColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 10,
        fontSize: 14,
        color: '#333',
        minHeight: 100,
        marginTop: 5,
    },
    calendarImportContainer: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    calendarImportTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 12,
    },
    calendarButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 12,
        paddingHorizontal: 15,
        minWidth: 100,
        gap: 8,
    },
    calendarButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
});
