import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/priorities`;

export interface CustomPriorities {
    [issueKey: string]: string;
}

export const getStoredPriorities = async (): Promise<CustomPriorities> => {
    try {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching custom priorities:', error);
        return {};
    }
};

export const storePriority = async (issueKey: string, priority: string): Promise<void> => {
    try {
        await axios.post(`${API_BASE_URL}/${issueKey}`, { priority });
    } catch (error) {
        console.error('Error storing custom priority:', error);
        throw error;
    }
};

export const removePriority = async (issueKey: string): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/${issueKey}`);
    } catch (error) {
        console.error('Error removing custom priority:', error);
        throw error;
    }
};

export const clearAllPriorities = async (): Promise<void> => {
    try {
        await axios.delete(API_BASE_URL);
    } catch (error) {
        console.error('Error clearing custom priorities:', error);
        throw error;
    }
}; 