import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert
} from '@mui/material';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // This is just an example password - in a real app, this would be handled securely on the backend
    const CORRECT_PASSWORD = 'jira2024';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            onLogin();
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5'
            }}
        >
            <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
                <CardContent>
                    <Typography variant="h5" component="h1" gutterBottom align="center">
                        Jira Dashboard Login
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            error={!!error}
                            helperText={error}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            type="submit"
                            sx={{ mt: 2 }}
                        >
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login; 