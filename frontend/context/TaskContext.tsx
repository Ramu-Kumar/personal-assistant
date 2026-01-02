import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';

// Re-using the Task interface structure. 
// Ideally should be in a shared 'types.ts' but defining here for now to avoid circular deps if TaskItem depends on something.
export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    isCompleted: boolean;
    dueDate: Date;
    priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description?: string;
    subTasks?: SubTask[];

    // Task Type
    taskType?: 'MANUAL' | 'LEARNING' | 'LOAN';

    // Learning Goal fields
    totalVideos?: number;
    completedVideos?: number;

    // Loan/EMI fields
    loanAmount?: number;
    loanOutstanding?: number;
    loanInterestRate?: number;
    loanEmi?: number;

    // Meeting fields
    meetingStartTime?: Date;
    meetingEndTime?: Date;
    meetingInfo?: string;
    meetingLink?: string;

    [key: string]: any; // For other backend properties
}

interface TaskContextType {
    tasks: Task[];
    isLoading: boolean;
    refreshTasks: () => Promise<void>;
    addTask: (taskData: any) => Promise<boolean>;
    updateTask: (id: string, taskData: any) => Promise<boolean>;
    deleteTask: (id: string) => Promise<boolean>;
    toggleTaskCompletion: (id: string, currentStatus: boolean, currentTitle: string, currentDueDate: Date, currentPriority: any, currentDescription: string, currentSubTasks: any) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// const API_URL = 'http://10.0.2.2:8080/api/tasks'; // Localhost for Android Emulator
const API_URL = 'https://personal-assistant-ezyo.onrender.com/api/tasks'; // Production URL

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            console.log("TaskContext: Fetching tasks...");
            const response = await fetch(API_URL);
            const data = await response.json();
            const mappedTasks = data.map((t: any) => ({
                ...t,
                isCompleted: t.completed, // Explicitly map backend property
                dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
                subTasks: t.subTasks ? t.subTasks.map((st: any) => ({ ...st, id: st.id || Math.random().toString(36).substr(2, 9) })) : []
            }));
            setTasks(mappedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const refreshTasks = async () => {
        setIsLoading(true);
        await fetchTasks();
    };

    const addTask = async (taskData: any): Promise<boolean> => {
        try {
            console.log("[API DEBUG] TaskContext: Adding task", JSON.stringify(taskData, null, 2));
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (response.ok) {
                const savedTask = await response.json();
                console.log("[API DEBUG] Server returned:", JSON.stringify(savedTask, null, 2));
                const taskWithDate = {
                    ...savedTask,
                    isCompleted: savedTask.completed,
                    dueDate: new Date(savedTask.dueDate),
                    subTasks: savedTask.subTasks ? savedTask.subTasks.map((st: any) => ({ ...st, id: st.id || Math.random().toString(36).substr(2, 9) })) : []
                };
                setTasks(prev => [...prev, taskWithDate]);
                return true;
            } else {
                const errorText = await response.text();
                console.error('[API DEBUG] Failed to add task:', response.status, errorText);
                return false;
            }
        } catch (error) {
            console.error('[API DEBUG] Error adding task:', error);
            return false;
        }
    };

    const updateTask = async (id: string, taskData: any): Promise<boolean> => {
        try {
            console.log("TaskContext: Updating task", id, taskData);
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (response.ok) {
                const savedTask = await response.json();
                const taskWithDate = {
                    ...savedTask,
                    isCompleted: savedTask.completed,
                    dueDate: new Date(savedTask.dueDate),
                    subTasks: savedTask.subTasks ? savedTask.subTasks.map((st: any) => ({ ...st, id: st.id || Math.random().toString(36).substr(2, 9) })) : []
                };
                setTasks(prev => prev.map(t => t.id === id ? taskWithDate : t));
                return true;
            } else {
                console.error('Failed to update task:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error updating task:', error);
            return false;
        }
    };

    const deleteTask = async (id: string): Promise<boolean> => {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            setTasks(prev => prev.filter(t => t.id !== id));
            return true;
        } catch (error) {
            console.error("Failed to delete task", error);
            return false;
        }
    };

    const toggleTaskCompletion = async (id: string, currentStatus: boolean, currentTitle: string, currentDueDate: Date, currentPriority: any, currentDescription: string, currentSubTasks: any) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));

        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentTitle,
                    completed: !currentStatus,
                    dueDate: currentDueDate.toISOString(),
                    priority: currentPriority,
                    description: currentDescription, // Include Description
                    subTasks: currentSubTasks
                })
            });
        } catch (error) {
            console.error("Failed to toggle task", error);
            // Revert on error could be implemented here
        }
    };

    return (
        <TaskContext.Provider value={{ tasks, isLoading, refreshTasks, addTask, updateTask, deleteTask, toggleTaskCompletion }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};
