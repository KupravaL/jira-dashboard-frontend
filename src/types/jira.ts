export interface JiraIssue {
    id: string;
    key: string;
    fields: {
        summary: string;
        description: string;
        status: {
            name: string;
        };
        priority: {
            name: string;
        };
        assignee?: {
            displayName: string;
        };
        created: string;
        updated: string;
    };
}

export interface JiraSearchResponse {
    issues: JiraIssue[];
    total: number;
    maxResults: number;
    startAt: number;
} 