import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ScienceIcon from '@mui/icons-material/Science';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TimelineIcon from '@mui/icons-material/Timeline';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ContactMailIcon from '@mui/icons-material/ContactMail';

const Homepage = () => {
  const features = [
    {
      icon: <CloudUploadIcon sx={{ fontSize: 40, color: '#30B4C2' }} />,
      title: 'Universal CSV Upload',
      description: 'Upload any CSV format - NASA, custom, or mixed formats. Our intelligent parser handles everything automatically.',
      color: '#30B4C2'
    },
    {
      icon: <TimelineIcon sx={{ fontSize: 40, color: '#30B4C2' }} />,
      title: 'Real-Time Analysis',
      description: 'Connect via WebSocket for live exoplanet candidate analysis with instant results and updates.',
      color: '#30B4C2'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: '#30B4C2' }} />,
      title: 'AI-Powered Predictions',
      description: 'Advanced machine learning models trained on NASA data provide accurate exoplanet probability scores.',
      color: '#30B4C2'
    },
    {
      icon: <ScienceIcon sx={{ fontSize: 40, color: '#30B4C2' }} />,
      title: 'Interactive Visualizations',
      description: 'Beautiful charts and graphs help you understand your data and prediction results intuitively.',
      color: '#30B4C2'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Candidates Analyzed' },
    { number: '99.2%', label: 'Accuracy Rate' },
    { number: '< 1s', label: 'Processing Time' },
    { number: '24/7', label: 'Availability' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(48, 180, 194, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} lg={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="h2" component="h1" gutterBottom sx={{
                  background: 'linear-gradient(45deg, #30B4C2 30%, #FFA500 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold',
                  mb: 3
                }}>
                  🪐 Discover Exoplanets with AI
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                  Advanced machine learning platform for exoplanet detection using NASA data.
                  Upload CSV files, connect real-time, and get instant AI-powered predictions.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                  <Button
                    component={Link}
                    to="/dashboard"
                    variant="contained"
                    size="large"
                    startIcon={<RocketLaunchIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #30B4C2 30%, #FFA500 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #2A9BA8 30%, #E69500 90%)'
                      },
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem'
                    }}
                  >
                    Launch Dashboard
                  </Button>
                  <Button
                    component={Link}
                    to="/about"
                    variant="outlined"
                    size="large"
                    sx={{
                      color: '#30B4C2',
                      borderColor: '#30B4C2',
                      '&:hover': {
                        backgroundColor: 'rgba(48, 180, 194, 0.1)',
                        borderColor: '#30B4C2'
                      },
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem'
                    }}
                  >
                    Learn More
                  </Button>
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} lg={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    right: '20px',
                    bottom: '20px',
                    background: 'linear-gradient(45deg, #30B4C2, #FFA500)',
                    borderRadius: '20px',
                    opacity: 0.1,
                    zIndex: 0
                  }
                }}>
                  <Box sx={{
                    position: 'relative',
                    zIndex: 1,
                    background: 'rgba(22, 27, 34, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    p: 4,
                    border: '1px solid rgba(48, 180, 194, 0.2)'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#30B4C2' }}>
                      Live Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      {stats.map((stat, index) => (
                        <Grid item xs={6} key={index}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: '#FFA500', fontWeight: 'bold' }}>
                              {stat.number}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {stat.label}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'background.paper' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{
              color: '#30B4C2',
              fontWeight: 'bold',
              mb: 6
            }}>
              Powerful Features
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card sx={{
                    height: '100%',
                    background: 'rgba(22, 27, 34, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(48, 180, 194, 0.2)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(48, 180, 194, 0.1)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {feature.icon}
                        <Typography variant="h6" sx={{ ml: 2, color: feature.color }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography variant="body1" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Chip
                        label="Available Now"
                        color="primary"
                        size="small"
                        sx={{ backgroundColor: '#30B4C2' }}
                      />
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)',
        position: 'relative'
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="h2" gutterBottom sx={{
                color: '#30B4C2',
                fontWeight: 'bold'
              }}>
                Ready to Discover Exoplanets?
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
                Join thousands of researchers using our AI-powered platform to analyze exoplanet candidates.
                Upload your data or connect real-time for instant results.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                <Button
                  component={Link}
                  to="/dashboard"
                  variant="contained"
                  size="large"
                  startIcon={<SpeedIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #30B4C2 30%, #FFA500 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #2A9BA8 30%, #E69500 90%)'
                    },
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  Get Started Now
                </Button>
                <Button
                  component={Link}
                  to="/contact"
                  variant="outlined"
                  size="large"
                  startIcon={<ContactMailIcon />}
                  sx={{
                    color: '#30B4C2',
                    borderColor: '#30B4C2',
                    '&:hover': {
                      backgroundColor: 'rgba(48, 180, 194, 0.1)',
                      borderColor: '#30B4C2'
                    },
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  Contact Us
                </Button>
                <Button
                  component={Link}
                  to="/docs"
                  variant="outlined"
                  size="large"
                  sx={{
                    color: '#30B4C2',
                    borderColor: '#30B4C2',
                    '&:hover': {
                      backgroundColor: 'rgba(48, 180, 194, 0.1)',
                      borderColor: '#30B4C2'
                    },
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  View Documentation
                </Button>
              </Stack>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Homepage;