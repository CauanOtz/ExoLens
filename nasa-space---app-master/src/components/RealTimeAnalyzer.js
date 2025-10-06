import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ScienceIcon from '@mui/icons-material/Science';

const RealTimeAnalyzer = ({ onPrediction, onConnectionChange, disabled }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [testCandidate, setTestCandidate] = useState({
    koi_period: 3.5,
    koi_time0bk: 2458321.5,
    koi_depth: 150,
    koi_duration: 3.0,
    koi_prad: 2.1,
    koi_teq: 850,
    koi_insol: 1.2,
    koi_slogg: 4.3,
    koi_srad: 1.1,
    koi_steff: 5800,
    koi_smass: 0.95,
    koi_sage: 4.5
  });
  const [lastPrediction, setLastPrediction] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'success') {
            setLastPrediction(data);
            onPrediction(data);
          } else if (data.status === 'error') {
            setConnectionStatus('error');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const sendTestCandidate = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const candidateData = {
        id: `TEST_${Date.now()}`,
        ...testCandidate
      };

      wsRef.current.send(JSON.stringify({ candidate: candidateData }));
      setConnectionStatus('sending');
    }
  };

  const updateTestCandidate = (field, value) => {
    setTestCandidate(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  return (
    <Box>
      {/* Connection Status */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Status: {connectionStatus}
          </Typography>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isConnected ? (
            <Button
              variant="contained"
              onClick={connectWebSocket}
              disabled={disabled}
              startIcon={<PlayArrowIcon />}
              sx={{
                background: 'linear-gradient(45deg, #30B4C2 30%, #4CAF50 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2A9BA8 30%, #45a049 90%)'
                }
              }}
            >
              Connect
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={disconnectWebSocket}
              disabled={disabled}
              startIcon={<StopIcon />}
              sx={{
                color: '#f44336',
                borderColor: '#f44336',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderColor: '#f44336'
                }
              }}
            >
              Disconnect
            </Button>
          )}

          <Button
            variant="contained"
            onClick={sendTestCandidate}
            disabled={!isConnected || disabled}
            sx={{
              background: 'linear-gradient(45deg, #FFA500 30%, #FF9800 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #E69500 30%, #F57C00 90%)'
              }
            }}
          >
            Send Test
          </Button>
        </Box>
      </Box>

      {/* Test Candidate Form */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              p: 3,
              mb: 3,
              background: 'rgba(13, 17, 23, 0.5)',
              border: '1px solid rgba(48, 180, 194, 0.2)'
            }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ScienceIcon sx={{ mr: 1, color: '#30B4C2' }} />
                Test Candidate Parameters
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <TextField
                  label="Period (days)"
                  type="number"
                  value={testCandidate.koi_period}
                  onChange={(e) => updateTestCandidate('koi_period', e.target.value)}
                  size="small"
                  sx={{ input: { color: '#E6EDF3' } }}
                />
                <TextField
                  label="Transit Time"
                  type="number"
                  value={testCandidate.koi_time0bk}
                  onChange={(e) => updateTestCandidate('koi_time0bk', e.target.value)}
                  size="small"
                  sx={{ input: { color: '#E6EDF3' } }}
                />
                <TextField
                  label="Depth (ppm)"
                  type="number"
                  value={testCandidate.koi_depth}
                  onChange={(e) => updateTestCandidate('koi_depth', e.target.value)}
                  size="small"
                  sx={{ input: { color: '#E6EDF3' } }}
                />
                <TextField
                  label="Duration (hours)"
                  type="number"
                  value={testCandidate.koi_duration}
                  onChange={(e) => updateTestCandidate('koi_duration', e.target.value)}
                  size="small"
                  sx={{ input: { color: '#E6EDF3' } }}
                />
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Prediction Display */}
      {lastPrediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert severity="info" sx={{
            background: 'rgba(48, 180, 194, 0.1)',
            border: '1px solid rgba(48, 180, 194, 0.3)',
            '& .MuiAlert-icon': {
              color: '#30B4C2'
            }
          }}>
            <Typography variant="body2">
              <strong>Latest Prediction:</strong> {lastPrediction.id} - {(lastPrediction.prob_planet * 100).toFixed(1)}% probability
            </Typography>
          </Alert>
        </motion.div>
      )}

      {/* Connection Status Messages */}
      <AnimatePresence>
        {connectionStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to connect to real-time server. Make sure the backend is running.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default RealTimeAnalyzer;