import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SendIcon from '@mui/icons-material/Send';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const contactInfo = [
    {
      icon: <EmailIcon sx={{ fontSize: 40, color: '#30B4C2' }} />,
      title: 'Email',
      content: 'vijayjoping@example.com',
      description: 'Send us an email for inquiries'
    },
    {
      icon: <PhoneIcon sx={{ fontSize: 40, color: '#30B4C2' }} />,
      title: 'Phone',
      content: '+1 (555) 123-4567',
      description: 'Call us during business hours'
    },
    {
      icon: <LocationOnIcon sx={{ fontSize: 40, color: '#30B4C2' }} />,
      title: 'Location',
      content: 'San Francisco, CA',
      description: 'Visit our headquarters'
    }
  ];

  return (
    <Box sx={{ py: 4, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{
            color: '#30B4C2',
            fontWeight: 'bold',
            mb: 4,
            textAlign: 'center'
          }}>
            📞 Contact Us
          </Typography>

          <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', mb: 6 }}>
            Get in touch with our team for support, collaboration, or questions about exoplanet detection
          </Typography>

          <Grid container spacing={4}>
            {/* Contact Information Cards */}
            <Grid item xs={12} md={4}>
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{
                    mb: 3,
                    background: 'rgba(22, 27, 34, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(48, 180, 194, 0.2)',
                    '&:hover': {
                      border: '1px solid rgba(48, 180, 194, 0.4)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease'
                    }
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      {info.icon}
                      <Typography variant="h6" sx={{ color: '#30B4C2', mt: 2, mb: 1 }}>
                        {info.title}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#E6EDF3', mb: 1 }}>
                        {info.content}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {info.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Team Members */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card sx={{
                  background: 'rgba(22, 27, 34, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(48, 180, 194, 0.2)'
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ color: '#30B4C2', mb: 3 }}>
                      Meet Our Team
                    </Typography>

                    {/* Hema Harshini Pydimarri */}
                    <Box sx={{ mb: 4, p: 3, border: '1px solid rgba(48, 180, 194, 0.2)', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ color: '#30B4C2', mb: 1, fontWeight: 'bold' }}>
                        Hema Harshini Pydimarri
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFA500', mb: 2 }}>
                        Technical Lead & Research
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Leading technical development and research initiatives for exoplanet detection systems.
                      </Typography>
                      <IconButton
                        component="a"
                        href="https://www.linkedin.com/in/hema-harshini-pydimarri/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#0077B5',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 119, 181, 0.1)',
                            transform: 'scale(1.1)',
                            transition: 'all 0.3s ease'
                          }
                        }}
                      >
                        <LinkedInIcon sx={{ fontSize: 32 }} />
                      </IconButton>
                    </Box>

                    {/* Sukeerthi Langu */}
                    <Box sx={{ mb: 4, p: 3, border: '1px solid rgba(48, 180, 194, 0.2)', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ color: '#30B4C2', mb: 1, fontWeight: 'bold' }}>
                        Sukeerthi Langu
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFA500', mb: 2 }}>
                        AI Research Scientist
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Specializing in machine learning algorithms and astronomical data analysis.
                      </Typography>
                      <IconButton
                        component="a"
                        href="https://www.linkedin.com/in/sukeerthi-langu/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#0077B5',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 119, 181, 0.1)',
                            transform: 'scale(1.1)',
                            transition: 'all 0.3s ease'
                          }
                        }}
                      >
                        <LinkedInIcon sx={{ fontSize: 32 }} />
                      </IconButton>
                    </Box>

                    {/* Vijay Jangid */}
                    <Box sx={{ p: 3, border: '1px solid rgba(48, 180, 194, 0.2)', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ color: '#30B4C2', mb: 1, fontWeight: 'bold' }}>
                        Vijay Jangid
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFA500', mb: 2 }}>
                        AI/ML Developer
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Developing advanced machine learning models for exoplanet detection and analysis.
                      </Typography>
                      <IconButton
                        component="a"
                        href="https://www.linkedin.com/in/vijay----jangid/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#0077B5',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 119, 181, 0.1)',
                            transform: 'scale(1.1)',
                            transition: 'all 0.3s ease'
                          }
                        }}
                      >
                        <LinkedInIcon sx={{ fontSize: 32 }} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Contact Form */}
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Paper sx={{
                  p: 4,
                  background: 'rgba(22, 27, 34, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(48, 180, 194, 0.2)'
                }}>
                  <Typography variant="h5" gutterBottom sx={{ color: '#30B4C2', mb: 3 }}>
                    Send us a Message
                  </Typography>

                  {submitted && (
                    <Alert severity="success" sx={{
                      mb: 3,
                      background: 'rgba(48, 180, 194, 0.1)',
                      border: '1px solid rgba(48, 180, 194, 0.3)',
                      '& .MuiAlert-icon': { color: '#30B4C2' }
                    }}>
                      Thank you for your message! We'll get back to you soon.
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(13, 17, 23, 0.5)',
                              '& fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#30B4C2',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#90b7cb',
                              '&.Mui-focused': {
                                color: '#30B4C2',
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              color: '#E6EDF3',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(13, 17, 23, 0.5)',
                              '& fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#30B4C2',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#90b7cb',
                              '&.Mui-focused': {
                                color: '#30B4C2',
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              color: '#E6EDF3',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(13, 17, 23, 0.5)',
                              '& fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#30B4C2',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#90b7cb',
                              '&.Mui-focused': {
                                color: '#30B4C2',
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              color: '#E6EDF3',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          label="Message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(13, 17, 23, 0.5)',
                              '& fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(48, 180, 194, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#30B4C2',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#90b7cb',
                              '&.Mui-focused': {
                                color: '#30B4C2',
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              color: '#E6EDF3',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          endIcon={<SendIcon />}
                          sx={{
                            backgroundColor: '#30B4C2',
                            color: '#0D1117',
                            fontSize: '1.1rem',
                            px: 4,
                            py: 1.5,
                            '&:hover': {
                              backgroundColor: '#2A9BA8',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(48, 180, 194, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Send Message
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Contact;