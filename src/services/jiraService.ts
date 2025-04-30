import axios from 'axios';
import { JiraSearchResponse } from '../types/jira';

// Use the environment variable for the backend API URL
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/jira`;

const jiraApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

export interface SearchParams {
    project?: string;
    status?: string[];
    priority?: string[];
    assignee?: string[];
    hasDependencies?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    startAt?: number;
    maxResults?: number;
}

export const searchIssues = async (params: SearchParams = {}): Promise<JiraSearchResponse> => {
    try {
        // Build JQL query
        let jql = [];
        
        if (params.project) {
            jql.push(`project = "${params.project}"`);
        }
        
        if (params.status && params.status.length > 0) {
            jql.push(`status in (${params.status.map(s => `"${s}"`).join(',')})`);
        }
        
        if (params.priority && params.priority.length > 0) {
            jql.push(`priority in (${params.priority.map(p => `"${p}"`).join(',')})`);
        }
        
        if (params.assignee && params.assignee.length > 0) {
            if (params.assignee.includes('UNASSIGNED')) {
                jql.push(`(assignee is EMPTY OR assignee in (${params.assignee.filter(a => a !== 'UNASSIGNED').map(a => `"${a}"`).join(',')}))`);
            } else {
                jql.push(`assignee in (${params.assignee.map(a => `"${a}"`).join(',')})`);
            }
        }

        if (params.hasDependencies === true) {
            jql.push('issueFunction in linkedIssuesOf("issueKey")');
        } else if (params.hasDependencies === false) {
            jql.push('NOT issueFunction in linkedIssuesOf("issueKey")');
        }
        
        if (params.createdAfter) {
            jql.push(`created >= "${params.createdAfter}"`);
        }
        
        if (params.createdBefore) {
            jql.push(`created <= "${params.createdBefore}"`);
        }

        // Build the final query
        const finalQuery = jql.length > 0 
            ? `${jql.join(' AND ')} ORDER BY created DESC`
            : 'ORDER BY created DESC';

        console.log('Sending request to:', `${API_BASE_URL}/search`);
        console.log('With JQL:', finalQuery);

        const response = await jiraApi.post('/search', {
            jql: finalQuery,
            startAt: params.startAt || 0,
            maxResults: params.maxResults || 50,
            fields: [
                'summary',
                'description',
                'status',
                'priority',
                'assignee',
                'created',
                'updated',
                'project',
                'issuelinks'
            ]
        });

        console.log('API Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching Jira issues:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: {
                url: error.config?.url,
                params: error.config?.params
            }
        });
        throw error;
    }
};

export const getProjects = async () => {
    try {
        console.log('Fetching projects from:', API_BASE_URL);
        const response = await jiraApi.get('/');
        console.log('Projects response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching projects:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

export const getAssignees = async (): Promise<any[]> => {
    try {
        console.log('Fetching users from Jira');
        const response = await jiraApi.get('/users');
        console.log(`Successfully fetched ${response.data.length} users`);
        
        // Sort users by display name
        return response.data.sort((a: any, b: any) => 
            a.displayName.localeCompare(b.displayName)
        );
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return [];
    }
}; 