
import { Box, Typography, Card, CardContent, Button, TextField } from '@mui/material';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card sx={{ minWidth: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>Create Account</Typography>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Full Name" type="text" required />
            <TextField label="Email" type="email" required />
            <TextField label="Password" type="password" required />
            <TextField label="Confirm Password" type="password" required />
            <Button type="submit" variant="contained" color="primary">Sign Up</Button>
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account? <Link href="/login">Sign In</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

