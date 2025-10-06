import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  Divider,
  IconButton,
  Stack
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box sx={{
      background: 'rgba(13, 17, 23, 0.95)',
      borderTop: '1px solid rgba(48, 180, 194, 0.2)',
      mt: 'auto'
    }}>
      <Container maxWidth="lg">
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4}>
            {/* Logo and Description */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TravelExploreIcon sx={{ mr: 2, fontSize: 32, color: '#30B4C2' }} />
                <Typography variant="h6" sx={{ color: '#30B4C2', fontWeight: 'bold' }}>
                  Exoplanet AI
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Advanced AI-powered platform for exoplanet detection using NASA data.
                Discover new worlds with machine learning and real-time analysis.
              </Typography>
              <Stack direction="row" spacing={2}>
                <IconButton
                  component={Link}
                  href="https://github.com"
                  sx={{
                    color: '#30B4C2',
                    '&:hover': { backgroundColor: 'rgba(48, 180, 194, 0.1)' }
                  }}
                >
                  <GitHubIcon />
                </IconButton>
                <IconButton
                  component={Link}
                  href="mailto:support@exoplanet-ai.com"
                  sx={{
                    color: '#30B4C2',
                    '&:hover': { backgroundColor: 'rgba(48, 180, 194, 0.1)' }
                  }}
                >
                  <EmailIcon />
                </IconButton>
              </Stack>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: '#30B4C2' }}>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Link
                  component={RouterLink}
                  to="/"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  Home
                </Link>
                <Link
                  component={RouterLink}
                  to="/dashboard"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  component={RouterLink}
                  to="/docs"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  Documentation
                </Link>
                <Link
                  component={RouterLink}
                  to="/about"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  About
                </Link>
              </Stack>
            </Grid>

            {/* Resources */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: '#30B4C2' }}>
                Resources
              </Typography>
              <Stack spacing={1}>
                <Link
                  href="https://exoplanetarchive.ipac.caltech.edu/"
                  target="_blank"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  NASA Exoplanet Archive
                </Link>
                <Link
                  href="https://science.nasa.gov/missions/kepler"
                  target="_blank"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  Kepler Mission
                </Link>
                <Link
                  href="https://science.nasa.gov/mission/tess/"
                  target="_blank"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  TESS Mission
                </Link>
                <Link
                  href="https://ui.adsabs.harvard.edu/"
                  target="_blank"
                  sx={{
                    color: '#90b7cb',
                    textDecoration: 'none',
                    '&:hover': { color: '#30B4C2' }
                  }}
                >
                  Research Papers
                </Link>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{
            my: 4,
            borderColor: 'rgba(48, 180, 194, 0.2)'
          }} />

          {/* Copyright */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              © {currentYear} Exoplanet AI Detection Platform. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Link
                href="#"
                sx={{
                  color: '#90b7cb',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': { color: '#30B4C2' }
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#90b7cb',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': { color: '#30B4C2' }
                }}
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#90b7cb',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': { color: '#30B4C2' }
                }}
              >
                Support
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;