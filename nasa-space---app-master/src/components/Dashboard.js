import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Button
} from '@mui/material';
import { motion } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ScienceIcon from '@mui/icons-material/Science';
import TimelineIcon from '@mui/icons-material/Timeline';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CsvUpload from './CsvUpload';
import RealTimeAnalyzer from './RealTimeAnalyzer';
import ResultsDisplay from './ResultsDisplay';

const Dashboard = () => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const handleCsvUpload = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/predict_csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPredictions(data.predictions);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRealTimePrediction = useCallback((prediction) => {
    setPredictions(prev => [prediction, ...prev.slice(0, 49)]); // Keep last 50
  }, []);

  const handleWsConnection = useCallback((connected) => {
    setWsConnected(connected);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{
          background: 'linear-gradient(45deg, #30B4C2 30%, #FFA500 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          mb: 2
        }}>
          🪐 Exoplanet Detection Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Upload CSV files or connect real-time for AI-powered exoplanet candidate analysis
        </Typography>

        {/* Sample Dataset Section */}
        <Paper sx={{
          p: 3,
          mb: 4,
          background: 'rgba(22, 27, 34, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(48, 180, 194, 0.2)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: '#30B4C2' }} />
            <Typography variant="h6" sx={{ color: '#30B4C2' }}>
              Getting Started: Try Sample Data
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            New to exoplanet detection? Download our sample datasets to test the system with realistic scenarios.
            We provide both simple positive cases and mixed results (positive + negative cases) for comprehensive testing.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/sample_exoplanet_data.csv';
                link.download = 'sample_exoplanet_data.csv';
                link.click();
              }}
              sx={{
                background: 'linear-gradient(45deg, #30B4C2 30%, #FFA500 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2A9BA8 30%, #E69500 90%)'
                },
                px: 4,
                py: 1.5
              }}
            >
              Download Simple Dataset (20 candidates)
            </Button>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/mixed_exoplanet_results.csv';
                link.download = 'mixed_exoplanet_results.csv';
                link.click();
              }}
              sx={{
                color: '#30B4C2',
                borderColor: '#30B4C2',
                '&:hover': {
                  backgroundColor: 'rgba(48, 180, 194, 0.1)',
                  borderColor: '#30B4C2'
                },
                px: 4,
                py: 1.5
              }}
            >
              Download Mixed Results (Positive + Negative)
            </Button>

            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Testing Instructions:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Download either dataset (simple or mixed results)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2. Upload the CSV file using the "CSV Upload" section
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. View AI predictions with probability scores
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Dataset Types:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <em>Simple Dataset:</em> 20 exoplanet candidates for basic testing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <em>Mixed Results:</em> Realistic mix of positive and negative cases
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* CSV Upload Section */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            height: '100%',
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(48, 180, 194, 0.2)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudUploadIcon sx={{ mr: 1, color: '#30B4C2' }} />
                <Typography variant="h6">CSV Upload</Typography>
              </Box>
              <CsvUpload onUpload={handleCsvUpload} disabled={isLoading} />
            </CardContent>
          </Card>
        </Grid>

        {/* Real-Time Analysis Section */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            height: '100%',
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(48, 180, 194, 0.2)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ mr: 1, color: '#30B4C2' }} />
                <Typography variant="h6">Real-Time Analysis</Typography>
                {wsConnected && (
                  <Chip
                    label="Connected"
                    color="success"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Box>
              <RealTimeAnalyzer
                onPrediction={handleRealTimePrediction}
                onConnectionChange={handleWsConnection}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Loading Progress */}
        {isLoading && (
          <Grid item xs={12}>
            <Paper sx={{
              p: 3,
              background: 'rgba(22, 27, 34, 0.8)',
              backdropFilter: 'blur(10px)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon sx={{ mr: 2, color: '#30B4C2' }} />
                <Typography variant="h6">Analyzing...</Typography>
              </Box>
              <LinearProgress sx={{
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#30B4C2'
                }
              }} />
            </Paper>
          </Grid>
        )}

        {/* Results Display */}
        {predictions.length > 0 && (
          <Grid item xs={12}>
            <ResultsDisplay predictions={predictions} />
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
};

export default Dashboard;