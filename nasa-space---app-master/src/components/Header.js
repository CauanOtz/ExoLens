import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Header = () => {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Documentation', path: '/docs' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <AppBar position="static" sx={{
      background: 'rgba(13, 17, 23, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(48, 180, 194, 0.2)'
    }}>
      <Toolbar>
        <TravelExploreIcon sx={{ mr: 2, fontSize: 32, color: '#30B4C2' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Exoplanet AI Detection
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            component={Link}
            to="/"
            variant={location.pathname === '/' ? 'contained' : 'outlined'}
            sx={{
              color: location.pathname === '/' ? '#30B4C2' : '#E6EDF3',
              borderColor: '#30B4C2',
              '&:hover': {
                backgroundColor: 'rgba(48, 180, 194, 0.1)',
                borderColor: '#30B4C2'
              }
            }}
          >
            Home
          </Button>
          <Button
            component={Link}
            to="/dashboard"
            variant={location.pathname === '/dashboard' ? 'contained' : 'outlined'}
            sx={{
              color: location.pathname === '/dashboard' ? '#30B4C2' : '#E6EDF3',
              borderColor: '#30B4C2',
              '&:hover': {
                backgroundColor: 'rgba(48, 180, 194, 0.1)',
                borderColor: '#30B4C2'
              }
            }}
          >
            Dashboard
          </Button>
          <Button
            component={Link}
            to="/docs"
            variant={location.pathname === '/docs' ? 'contained' : 'outlined'}
            sx={{
              color: location.pathname === '/docs' ? '#30B4C2' : '#E6EDF3',
              borderColor: '#30B4C2',
              '&:hover': {
                backgroundColor: 'rgba(48, 180, 194, 0.1)',
                borderColor: '#30B4C2'
              }
            }}
          >
            Docs
          </Button>
          <Button
            component={Link}
            to="/about"
            variant={location.pathname === '/about' ? 'contained' : 'outlined'}
            sx={{
              color: location.pathname === '/about' ? '#30B4C2' : '#E6EDF3',
              borderColor: '#30B4C2',
              '&:hover': {
                backgroundColor: 'rgba(48, 180, 194, 0.1)',
                borderColor: '#30B4C2'
              }
            }}
          >
            About
          </Button>
          <IconButton
            onClick={handleMenu}
            sx={{
              color: '#E6EDF3',
              '&:hover': {
                backgroundColor: 'rgba(48, 180, 194, 0.1)',
                color: '#30B4C2'
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(13, 17, 23, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(48, 180, 194, 0.2)',
                '& .MuiMenuItem-root': {
                  color: '#E6EDF3',
                  '&:hover': {
                    backgroundColor: 'rgba(48, 180, 194, 0.1)',
                    color: '#30B4C2'
                  }
                }
              }
            }}
          >
            {pages.map((page) => (
              <MenuItem
                key={page.path}
                component={Link}
                to={page.path}
                onClick={handleClose}
                sx={{
                  backgroundColor: location.pathname === page.path ? 'rgba(48, 180, 194, 0.1)' : 'transparent',
                  color: location.pathname === page.path ? '#30B4C2' : '#E6EDF3'
                }}
              >
                {page.name}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;