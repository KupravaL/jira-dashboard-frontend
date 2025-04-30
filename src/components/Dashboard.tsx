import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    CircularProgress,
    Chip,
    Container,
    Paper,
    Divider,
    Stack,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    SelectChangeEvent,
    Link,
    Switch,
    FormControlLabel
} from '@mui/material';
import { searchIssues, getProjects, getAssignees, SearchParams } from '../services/jiraService';
import { getStoredPriorities, storePriority, removePriority, CustomPriorities } from '../services/customPriorityService';
import { JiraIssue } from '../types/jira';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import FilterListIcon from '@mui/icons-material/FilterList';
import LogoutIcon from '@mui/icons-material/Logout';

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'done':
            return 'success';
        case 'in progress':
            return 'info';
        case 'to do':
            return 'warning';
        case 'dependencies':
            return 'secondary';
        default:
            return 'default';
    }
};

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [assignees, setAssignees] = useState<any[]>([]);
    const [filters, setFilters] = useState<SearchParams>({});
    const [showFilters, setShowFilters] = useState(true);
    const [customPriorities, setCustomPriorities] = useState<CustomPriorities>({});

    const statusOptions = ['To Do', 'In Progress', 'Done', 'Dependencies'];
    const customPriorityOptions = ['Urgent', 'High', 'Medium', 'Low'];

    const DEFAULT_ASSIGNEES = ['Vakho Tabatadze', 'Gigi gvaramia'];

    // Load priorities when component mounts
    useEffect(() => {
        const loadPriorities = async () => {
            try {
                const priorities = await getStoredPriorities();
                setCustomPriorities(priorities);
            } catch (error) {
                console.error('Failed to load priorities:', error);
            }
        };
        loadPriorities();
    }, []);

    // Separate effect for fetching assignees
    useEffect(() => {
        const fetchAssignees = async () => {
            try {
                const assigneesData = await getAssignees();
                setAssignees(assigneesData);
                
                // Set default assignees after loading the assignee data
                const defaultAssigneeIds = assigneesData
                    .filter(a => DEFAULT_ASSIGNEES.includes(a.displayName))
                    .map(a => a.accountId);
                
                if (defaultAssigneeIds.length > 0) {
                    setFilters(prev => ({ ...prev, assignee: defaultAssigneeIds }));
                }
            } catch (err) {
                console.error('Failed to fetch assignees:', err);
            }
        };
        fetchAssignees();
    }, []); // Only fetch once when component mounts

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, issuesData] = await Promise.all([
                    getProjects(),
                    searchIssues(filters)
                ]);
                setProjects(projectsData);
                setIssues(issuesData.issues);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch data. Please check your API configuration.');
                setLoading(false);
            }
        };

        fetchData();
    }, [filters]);

    const handleFilterChange = (field: keyof SearchParams, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handlePriorityChange = async (issueKey: string, priority: string) => {
        try {
            if (priority === '') {
                await removePriority(issueKey);
                setCustomPriorities(prev => {
                    const updated = { ...prev };
                    delete updated[issueKey];
                    return updated;
                });
            } else {
                await storePriority(issueKey, priority);
                setCustomPriorities(prev => ({
                    ...prev,
                    [issueKey]: priority
                }));
            }
        } catch (error) {
            console.error('Failed to update priority:', error);
            // Optionally show an error message to the user
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent':
                return '#ef5350'; // red
            case 'high':
                return '#ff9800'; // orange
            case 'medium':
                return '#03a9f4'; // blue
            case 'low':
                return '#4caf50'; // green
            default:
                return undefined;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', py: 4 }}>
            <Container maxWidth="xl">
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h4" component="h1">
                            Jira Dashboard
                        </Typography>
                        <Box>
                            <Button
                                startIcon={<FilterListIcon />}
                                onClick={() => setShowFilters(!showFilters)}
                                variant="outlined"
                                sx={{ mr: 2 }}
                            >
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                            <Button
                                startIcon={<LogoutIcon />}
                                onClick={onLogout}
                                variant="outlined"
                                color="error"
                            >
                                Logout
                            </Button>
                        </Box>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">
                        Total Issues: {issues.length}
                    </Typography>

                    {showFilters && (
                        <Box sx={{ mt: 2 }}>
                            <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems="flex-start">
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Project</InputLabel>
                                    <Select
                                        value={filters.project || ''}
                                        onChange={(e) => handleFilterChange('project', e.target.value)}
                                        label="Project"
                                    >
                                        <MenuItem value="">All Projects</MenuItem>
                                        {projects.map((project) => (
                                            <MenuItem key={project.id} value={project.key}>
                                                {project.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Assignee</InputLabel>
                                    <Select
                                        multiple
                                        value={filters.assignee || []}
                                        onChange={(e) => handleFilterChange('assignee', e.target.value)}
                                        label="Assignee"
                                        renderValue={(selected) => {
                                            if (selected.length === 0) return 'All Assignees';
                                            if (selected.length === 1) {
                                                const assignee = assignees.find(a => a.accountId === selected[0]);
                                                return assignee ? assignee.displayName : 'Unassigned';
                                            }
                                            return `${selected.length} assignees selected`;
                                        }}
                                    >
                                        <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                                        {assignees.map((assignee) => (
                                            <MenuItem key={assignee.accountId} value={assignee.accountId}>
                                                {assignee.displayName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        multiple
                                        value={filters.status || []}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        label="Status"
                                    >
                                        {statusOptions.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        multiple
                                        value={filters.priority || []}
                                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                                        label="Priority"
                                    >
                                        {customPriorityOptions.map((priority) => (
                                            <MenuItem key={priority} value={priority}>
                                                {priority}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="outlined"
                                    onClick={() => setFilters({})}
                                    sx={{ mt: { xs: 1, md: 0 } }}
                                >
                                    Clear Filters
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Paper>

                {issues.length > 0 ? (
                    <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)'
                        },
                        gap: 3
                    }}>
                        {issues.map((issue) => (
                            <Link 
                                key={issue.id}
                                href={`${import.meta.env.VITE_JIRA_API_BASE_URL}/browse/${issue.key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ textDecoration: 'none' }}
                            >
                                <Card 
                                    sx={{ 
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.02)',
                                            boxShadow: 6,
                                            cursor: 'pointer'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Stack spacing={2}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    {issue.key}
                                                </Typography>
                                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                                    <Select
                                                        value={customPriorities[issue.key] || ''}
                                                        onChange={(e) => handlePriorityChange(issue.key, e.target.value)}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            backgroundColor: getPriorityColor(customPriorities[issue.key] || ''),
                                                            color: customPriorities[issue.key] ? 'white' : 'inherit',
                                                            '& .MuiSelect-icon': {
                                                                color: customPriorities[issue.key] ? 'white' : 'inherit'
                                                            }
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em>No priority</em>
                                                        </MenuItem>
                                                        {customPriorityOptions.map((priority) => (
                                                            <MenuItem 
                                                                key={priority} 
                                                                value={priority}
                                                                sx={{
                                                                    backgroundColor: getPriorityColor(priority),
                                                                    color: 'white',
                                                                    '&:hover': {
                                                                        backgroundColor: getPriorityColor(priority),
                                                                        opacity: 0.9
                                                                    }
                                                                }}
                                                            >
                                                                {priority}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>

                                            <Typography variant="body1" sx={{ 
                                                fontWeight: 'medium',
                                                minHeight: '3em',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {issue.fields.summary}
                                            </Typography>

                                            <Divider />

                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Tooltip title="Status">
                                                    <Chip 
                                                        label={issue.fields.status.name}
                                                        color={getStatusColor(issue.fields.status.name)}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                                {issue.fields.assignee && (
                                                    <Tooltip title="Assignee">
                                                        <Chip
                                                            icon={<PersonIcon />}
                                                            label={issue.fields.assignee.displayName}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={1}>
                                                <AccessTimeIcon fontSize="small" color="action" />
                                                <Typography variant="caption" color="text.secondary">
                                                    Created: {new Date(issue.fields.created).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </Box>
                ) : (
                    <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            No issues found
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            Try adjusting your filters or create new issues
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default Dashboard; 