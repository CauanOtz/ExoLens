import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';

const ResultsDisplay = ({ predictions }) => {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  // Process data for charts
  const probabilities = predictions.map(p => p.prob_planet * 100);
  const chartData = probabilities.map((prob, index) => ({
    name: predictions[index].id,
    probability: prob
  }));

  // Categorize predictions
  const highProb = predictions.filter(p => p.prob_planet > 0.7).length;
  const mediumProb = predictions.filter(p => p.prob_planet > 0.3 && p.prob_planet <= 0.7).length;
  const lowProb = predictions.filter(p => p.prob_planet <= 0.3).length;

  const pieData = [
    { name: 'High Probability', value: highProb, color: '#4caf50' },
    { name: 'Medium Probability', value: mediumProb, color: '#ff9800' },
    { name: 'Low Probability', value: lowProb, color: '#f44336' }
  ];

  const getProbabilityColor = (prob) => {
    if (prob > 0.7) return '#4caf50';
    if (prob > 0.3) return '#ff9800';
    return '#f44336';
  };

  const getProbabilityLabel = (prob) => {
    if (prob > 0.7) return 'High';
    if (prob > 0.3) return 'Medium';
    return 'Low';
  };

  const getProbabilityIcon = (prob) => {
    if (prob > 0.7) return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    if (prob > 0.3) return <HelpIcon sx={{ color: '#ff9800' }} />;
    return <CancelIcon sx={{ color: '#f44336' }} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{
        background: 'rgba(22, 27, 34, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(48, 180, 194, 0.2)'
      }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{
            color: '#30B4C2',
            display: 'flex',
            alignItems: 'center',
            mb: 3
          }}>
            📊 Analysis Results
          </Typography>

          {/* Summary Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 3,
                textAlign: 'center',
                background: 'rgba(13, 17, 23, 0.5)',
                border: '1px solid rgba(48, 180, 194, 0.2)'
              }}>
                <Typography variant="h4" sx={{ color: '#30B4C2', mb: 1 }}>
                  {predictions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Candidates
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 3,
                textAlign: 'center',
                background: 'rgba(13, 17, 23, 0.5)',
                border: '1px solid rgba(48, 180, 194, 0.2)'
              }}>
                <Typography variant="h4" sx={{ color: '#4caf50', mb: 1 }}>
                  {highProb}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High Probability
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 3,
                textAlign: 'center',
                background: 'rgba(13, 17, 23, 0.5)',
                border: '1px solid rgba(48, 180, 194, 0.2)'
              }}>
                <Typography variant="h4" sx={{ color: '#ff9800', mb: 1 }}>
                  {(probabilities.reduce((a, b) => a + b, 0) / probabilities.length).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Probability
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{
                p: 3,
                background: 'rgba(13, 17, 23, 0.5)',
                border: '1px solid rgba(48, 180, 194, 0.2)'
              }}>
                <Typography variant="h6" gutterBottom>
                  Probability Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(48, 180, 194, 0.2)" />
                    <XAxis
                      dataKey="name"
                      stroke="#90b7cb"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#90b7cb" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161B22',
                        border: '1px solid #30B4C2',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="probability" fill="#30B4C2" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper sx={{
                p: 3,
                background: 'rgba(13, 17, 23, 0.5)',
                border: '1px solid rgba(48, 180, 194, 0.2)'
              }}>
                <Typography variant="h6" gutterBottom>
                  Probability Categories
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161B22',
                        border: '1px solid #30B4C2',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2 }}>
                  {pieData.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: entry.color,
                          borderRadius: '50%',
                          mr: 1
                        }}
                      />
                      <Typography variant="body2">
                        {entry.name}: {entry.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: 'rgba(48, 180, 194, 0.2)' }} />

          {/* Detailed Results List */}
          <Typography variant="h6" gutterBottom>
            Detailed Results
          </Typography>

          <List>
            <AnimatePresence>
              {predictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ListItem sx={{
                    background: 'rgba(13, 17, 23, 0.5)',
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid rgba(48, 180, 194, 0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {getProbabilityIcon(prediction.prob_planet)}
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {prediction.id}
                            </Typography>
                            <Chip
                              label={`${getProbabilityLabel(prediction.prob_planet)} (${(prediction.prob_planet * 100).toFixed(1)}%)`}
                              size="small"
                              sx={{
                                backgroundColor: getProbabilityColor(prediction.prob_planet),
                                color: 'white'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {prediction.prob_planet > 0.5
                                ? '🌟 High probability of being an exoplanet - recommended for follow-up observations'
                                : prediction.prob_planet > 0.3
                                ? '🤔 Moderate probability - needs further investigation'
                                : '❌ Low probability - likely false positive'}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={prediction.prob_planet * 100}
                              sx={{
                                mt: 1,
                                height: 6,
                                borderRadius: 3,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getProbabilityColor(prediction.prob_planet),
                                  borderRadius: 3
                                }
                              }}
                            />
                          </Box>
                        }
                      />
                    </Box>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResultsDisplay;