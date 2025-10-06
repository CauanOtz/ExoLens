import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link
} from '@mui/material';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PublicIcon from '@mui/icons-material/Public';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';

const About = () => {
  const sections = [
    {
      icon: <PublicIcon sx={{ color: '#FFA500' }} />,
      title: 'What is Exoplanet Detection?',
      subtitle: 'The Quest for Exoplanets',
      content: 'An exoplanet is a planet that orbits a star outside our solar system. The search for these distant worlds is one of the most exciting frontiers in astronomy. Detecting exoplanets helps us understand planetary formation, the diversity of planets in our galaxy, and ultimately, increases the chances of finding life beyond Earth.',
      image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=400&fit=crop'
    },
    {
      icon: <SatelliteAltIcon sx={{ color: '#FFA500' }} />,
      title: 'NASA Data',
      subtitle: 'The Eyes in the Sky',
      content: 'We utilize publicly available data from NASA\'s Kepler and Transiting Exoplanet Survey Satellite (TESS) missions. These powerful telescopes monitor the brightness of hundreds of thousands of stars. When a planet passes in front of its star, it causes a tiny, periodic dip in the star\'s light. This data, known as a "light curve," is the key to discovering exoplanets.',
      image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=400&fit=crop'
    },
    {
      icon: <PsychologyIcon sx={{ color: '#FFA500' }} />,
      title: 'How We Use AI/ML',
      subtitle: 'AI at the Helm',
      content: 'Manually analyzing thousands of light curves is a monumental task. This is where Artificial Intelligence comes in. Our machine learning models are trained on confirmed exoplanet data to recognize the subtle transit signals hidden within the stellar noise. The AI acts as a powerful filter, highlighting the most promising candidates for further study.',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'
    }
  ];

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
          🚀 Discovering New Worlds with AI
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Learn about exoplanet detection, NASA missions, and how artificial intelligence revolutionizes astronomical research
        </Typography>
      </Box>

      {/* Hero Section */}
      <Card sx={{
        mb: 4,
        background: 'rgba(22, 27, 34, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(48, 180, 194, 0.2)'
      }}>
        <CardContent sx={{
          backgroundImage: 'linear-gradient(0deg, rgba(13, 17, 23, 1) 0%, rgba(13, 17, 23, 0) 50%), url("https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&h=400&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '320px',
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
              Discovering New Worlds with AI
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Main Content Sections */}
      <Grid container spacing={4}>
        {sections.map((section, index) => (
          <Grid item xs={12} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{
                background: 'rgba(22, 27, 34, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(48, 180, 194, 0.2)',
                overflow: 'hidden'
              }}>
                <CardContent sx={{
                  backgroundImage: `linear-gradient(0deg, rgba(13, 17, 23, 0.8) 0%, rgba(13, 17, 23, 0.2) 50%), url("${section.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px',
                  display: 'flex',
                  alignItems: 'flex-end'
                }}>
                  <Box sx={{ p: 3, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {section.icon}
                      <Typography variant="body2" sx={{ color: '#90b7cb', ml: 1 }}>
                        {section.title}
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                      {section.subtitle}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#90b7cb' }}>
                      {section.content}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Credits & Resources */}
      <Card sx={{
        mt: 4,
        background: 'rgba(22, 27, 34, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(48, 180, 194, 0.2)'
      }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ color: '#30B4C2' }}>
            Credits & Resources
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Accordion sx={{
                background: 'rgba(13, 17, 23, 0.5)',
                color: '#E6EDF3',
                '&:before': { display: 'none' }
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#30B4C2' }} />}>
                  <Typography>Acknowledgments</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    This project is made possible by the incredible work of NASA and the public availability of their data.
                    Special thanks to the teams behind the Kepler and TESS missions. This application was developed as a
                    demonstration of AI's potential in astronomical research.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12} md={4}>
              <Accordion sx={{
                background: 'rgba(13, 17, 23, 0.5)',
                color: '#E6EDF3',
                '&:before': { display: 'none' }
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#30B4C2' }} />}>
                  <Typography>NASA Data Sources</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Link href="#" sx={{ color: '#30B4C2', textDecoration: 'none' }}>
                            Mikulski Archive for Space Telescopes (MAST)
                          </Link>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Link href="#" sx={{ color: '#30B4C2', textDecoration: 'none' }}>
                            NASA Exoplanet Archive
                          </Link>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Link href="#" sx={{ color: '#30B4C2', textDecoration: 'none' }}>
                            Kepler Mission Data
                          </Link>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Link href="#" sx={{ color: '#30B4C2', textDecoration: 'none' }}>
                            TESS Mission Data
                          </Link>
                        }
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12} md={4}>
              <Accordion sx={{
                background: 'rgba(13, 17, 23, 0.5)',
                color: '#E6EDF3',
                '&:before': { display: 'none' }
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#30B4C2' }} />}>
                  <Typography>Relevant Research</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Link href="#" sx={{ color: '#30B4C2', textDecoration: 'none' }}>
                            Identifying Exoplanets with Deep Learning (Shallue & Vanderburg, 2018)
                          </Link>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Link href="#" sx={{ color: '#30B4C2', textDecoration: 'none' }}>
                            An overview of the TESS mission
                          </Link>
                        }
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default About;