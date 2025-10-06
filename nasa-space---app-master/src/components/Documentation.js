import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import ApiIcon from '@mui/icons-material/Api';
import StorageIcon from '@mui/icons-material/Storage';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

const Documentation = () => {
  const csvColumns = [
    { name: 'kepid', type: 'string', required: true, description: 'Kepler ID or unique candidate identifier' },
    { name: 'koi_period', type: 'number', required: true, description: 'Orbital period in days' },
    { name: 'koi_time0bk', type: 'number', required: true, description: 'Transit midpoint time (BJD - 2454833)' },
    { name: 'koi_depth', type: 'number', required: false, description: 'Transit depth in ppm' },
    { name: 'koi_duration', type: 'number', required: false, description: 'Transit duration in hours' },
    { name: 'koi_prad', type: 'number', required: false, description: 'Planet radius in Earth radii' },
    { name: 'koi_teq', type: 'number', required: false, description: 'Equilibrium temperature in Kelvin' },
    { name: 'koi_insol', type: 'number', required: false, description: 'Insolation flux relative to Earth' },
    { name: 'koi_slogg', type: 'number', required: false, description: 'Stellar surface gravity (log g)' },
    { name: 'koi_srad', type: 'number', required: false, description: 'Stellar radius in solar radii' },
    { name: 'koi_steff', type: 'number', required: false, description: 'Stellar effective temperature in Kelvin' },
    { name: 'koi_smass', type: 'number', required: false, description: 'Stellar mass in solar masses' },
    { name: 'koi_sage', type: 'number', required: false, description: 'Stellar age in Gyr' }
  ];

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/predict_csv',
      description: 'Upload CSV file for batch analysis',
      parameters: [
        { name: 'file', type: 'file', required: true, description: 'CSV file with exoplanet candidates' }
      ]
    },
    {
      method: 'GET',
      endpoint: '/ws',
      description: 'WebSocket endpoint for real-time analysis',
      parameters: [
        { name: 'candidate', type: 'object', required: true, description: 'JSON object with candidate parameters' }
      ]
    }
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{
            color: '#30B4C2',
            fontWeight: 'bold',
            mb: 4
          }}>
            📚 Documentation
          </Typography>

          {/* Quick Start */}
          <Paper sx={{
            p: 4,
            mb: 4,
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(48, 180, 194, 0.2)'
          }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#30B4C2', display: 'flex', alignItems: 'center' }}>
              <RocketLaunchIcon sx={{ mr: 1 }} />
              Quick Start Guide
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#FFA500' }}>
                1. Upload CSV File
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Navigate to the Dashboard and upload your CSV file containing exoplanet candidates.
                Our system automatically detects column formats and handles various CSV structures.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#FFA500' }}>
                2. Real-Time Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Connect to the WebSocket for live analysis. Send individual candidates and receive
                instant predictions with probability scores.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#FFA500' }}>
                3. View Results
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Analyze the results with interactive charts, detailed statistics, and downloadable reports.
                High-probability candidates are highlighted for further investigation.
              </Typography>
            </Box>
          </Paper>

          {/* CSV Format Documentation */}
          <Accordion sx={{
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(48, 180, 194, 0.2)',
            mb: 3
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#30B4C2' }} />}>
              <Typography variant="h5" sx={{ color: '#30B4C2', display: 'flex', alignItems: 'center' }}>
                <StorageIcon sx={{ mr: 1 }} />
                CSV File Format
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your CSV file should contain exoplanet candidate data. The system is flexible and can handle
                various column naming conventions. Here are the expected columns:
              </Typography>

              <TableContainer component={Paper} sx={{
                background: 'rgba(13, 17, 23, 0.5)',
                border: '1px solid rgba(48, 180, 194, 0.2)'
              }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#30B4C2', fontWeight: 'bold' }}>Column Name</TableCell>
                      <TableCell sx={{ color: '#30B4C2', fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ color: '#30B4C2', fontWeight: 'bold' }}>Required</TableCell>
                      <TableCell sx={{ color: '#30B4C2', fontWeight: 'bold' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvColumns.map((column) => (
                      <TableRow key={column.name}>
                        <TableCell sx={{ color: '#E6EDF3' }}>
                          <Typography component="code" sx={{
                            backgroundColor: 'rgba(48, 180, 194, 0.1)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                          }}>
                            {column.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#90b7cb' }}>{column.type}</TableCell>
                        <TableCell>
                          {column.required ? (
                            <Chip label="Required" color="error" size="small" />
                          ) : (
                            <Chip label="Optional" color="default" size="small" />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#90b7cb' }}>{column.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Alert severity="info" sx={{
                mt: 3,
                background: 'rgba(48, 180, 194, 0.1)',
                border: '1px solid rgba(48, 180, 194, 0.3)',
                '& .MuiAlert-icon': { color: '#30B4C2' }
              }}>
                <Typography variant="body2">
                  <strong>Note:</strong> The system uses intelligent column detection and can handle variations
                  in column naming (e.g., "period" instead of "koi_period"). Missing optional columns will be
                  filled with sensible defaults.
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>

          {/* API Documentation */}
          <Accordion sx={{
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(48, 180, 194, 0.2)',
            mb: 3
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#30B4C2' }} />}>
              <Typography variant="h5" sx={{ color: '#30B4C2', display: 'flex', alignItems: 'center' }}>
                <ApiIcon sx={{ mr: 1 }} />
                API Endpoints
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                The following API endpoints are available for integration:
              </Typography>

              {apiEndpoints.map((endpoint, index) => (
                <Paper key={index} sx={{
                  p: 3,
                  mb: 3,
                  background: 'rgba(13, 17, 23, 0.5)',
                  border: '1px solid rgba(48, 180, 194, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={endpoint.method}
                      color={endpoint.method === 'POST' ? 'primary' : 'secondary'}
                      sx={{ mr: 2 }}
                    />
                    <Typography component="code" sx={{
                      backgroundColor: 'rgba(48, 180, 194, 0.1)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {endpoint.endpoint}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {endpoint.description}
                  </Typography>

                  {endpoint.parameters && (
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ color: '#FFA500' }}>
                        Parameters:
                      </Typography>
                      {endpoint.parameters.map((param, paramIndex) => (
                        <Box key={paramIndex} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{param.name}</strong> ({param.type})
                            {param.required && <span style={{ color: '#f44336' }}> *</span>}
                            - {param.description}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              ))}

              <Alert severity="info" sx={{
                background: 'rgba(48, 180, 194, 0.1)',
                border: '1px solid rgba(48, 180, 194, 0.3)',
                '& .MuiAlert-icon': { color: '#30B4C2' }
              }}>
                <Typography variant="body2">
                  <strong>Base URL:</strong> http://localhost:8000<br />
                  All API endpoints support CORS and are accessible from the web interface.
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>

          {/* Code Examples */}
          <Accordion sx={{
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(48, 180, 194, 0.2)',
            mb: 3
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#30B4C2' }} />}>
              <Typography variant="h5" sx={{ color: '#30B4C2', display: 'flex', alignItems: 'center' }}>
                <CodeIcon sx={{ mr: 1 }} />
                Code Examples
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="h6" gutterBottom sx={{ color: '#FFA500' }}>
                CSV Upload with curl:
              </Typography>
              <Typography component="pre" sx={{
                display: 'block',
                backgroundColor: 'rgba(13, 17, 23, 0.8)',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                mb: 3,
                border: '1px solid rgba(48, 180, 194, 0.2)',
                fontSize: '0.875rem',
                overflow: 'auto'
              }}>
{`curl -X POST \\
  -F "file=@candidates.csv" \\
  http://localhost:8000/predict_csv`}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ color: '#FFA500' }}>
                WebSocket Example (JavaScript):
              </Typography>
              <Typography component="pre" sx={{
                display: 'block',
                backgroundColor: 'rgba(13, 17, 23, 0.8)',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                mb: 3,
                border: '1px solid rgba(48, 180, 194, 0.2)',
                fontSize: '0.875rem',
                overflow: 'auto'
              }}>
{`const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  const candidate = {
    kepid: 'K00001',
    koi_period: 3.5,
    koi_time0bk: 2458321.5,
    koi_depth: 150
  };
  ws.send(JSON.stringify({ candidate }));
};

ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  console.log('Prediction:', result.prob_planet);
};`}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ color: '#FFA500' }}>
                Python API Client:
              </Typography>
              <Typography component="pre" sx={{
                display: 'block',
                backgroundColor: 'rgba(13, 17, 23, 0.8)',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                border: '1px solid rgba(48, 180, 194, 0.2)',
                fontSize: '0.875rem',
                overflow: 'auto'
              }}>
{`import requests

# Upload CSV file
with open('candidates.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/predict_csv',
        files={'file': f}
    )

results = response.json()
print(results)`}
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Troubleshooting */}
          <Paper sx={{
            p: 4,
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(48, 180, 194, 0.2)'
          }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#30B4C2' }}>
              🔧 Troubleshooting
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="CSV Parsing Errors"
                  secondary="Ensure your CSV file uses commas as separators and has proper headers. The system can handle most formatting variations automatically."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="WebSocket Connection Issues"
                  secondary="Make sure both the React frontend (port 3000) and FastAPI backend (port 8000) are running. Check browser console for connection errors."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Large File Uploads"
                  secondary="For files larger than 10MB, consider splitting into smaller batches or contact support for enterprise solutions."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Model Accuracy"
                  secondary="The AI model provides probability scores based on training data. For research purposes, always verify results with multiple methods."
                />
              </ListItem>
            </List>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Documentation;