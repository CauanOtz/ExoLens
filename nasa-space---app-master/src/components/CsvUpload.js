import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Clear as ClearIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CsvUpload = ({ onUpload, disabled }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setUploadStatus(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
      'text/plain': ['.csv']
    },
    multiple: false,
    disabled: disabled
  });

  const handleUpload = async () => {
    if (!uploadedFile || !onUpload) return;

    setUploadStatus('uploading');
    try {
      await onUpload(uploadedFile);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setUploadStatus(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: '2px dashed',
                borderColor: isDragActive ? '#30B4C2' : 'rgba(48, 180, 194, 0.3)',
                backgroundColor: isDragActive
                  ? 'rgba(48, 180, 194, 0.1)'
                  : 'rgba(22, 27, 34, 0.5)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: disabled ? 'rgba(48, 180, 194, 0.3)' : '#30B4C2',
                  backgroundColor: disabled
                    ? 'rgba(22, 27, 34, 0.5)'
                    : 'rgba(48, 180, 194, 0.05)'
                },
                opacity: disabled ? 0.6 : 1
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: '#30B4C2', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop a CSV file'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse files
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
                Supports CSV files up to 10MB
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Paper sx={{
              p: 3,
              background: 'rgba(22, 27, 34, 0.8)',
              border: '1px solid rgba(48, 180, 194, 0.2)'
            }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <FileIcon sx={{ color: '#30B4C2' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={uploadedFile.name}
                    secondary={formatFileSize(uploadedFile.size)}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {uploadStatus === 'success' && (
                      <SuccessIcon sx={{ color: '#4caf50' }} />
                    )}
                    <IconButton
                      onClick={handleClear}
                      size="small"
                      disabled={disabled}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              </List>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={disabled || uploadStatus === 'uploading'}
                  sx={{
                    flex: 1,
                    background: 'linear-gradient(45deg, #30B4C2 30%, #FFA500 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #2A9BA8 30%, #E69500 90%)'
                    }
                  }}
                >
                  {uploadStatus === 'uploading' ? 'Analyzing...' : '🚀 Analyze File'}
                </Button>
              </Box>

              {uploadStatus === 'uploading' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#30B4C2' }}>
                    Processing file with AI model...
                  </Typography>
                </motion.div>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default CsvUpload;