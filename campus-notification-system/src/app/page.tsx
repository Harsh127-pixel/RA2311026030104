'use client';

import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Grid, 
  Box, 
  Card, 
  CardContent, 
  CardActionArea,
  Chip, 
  Badge, 
  Pagination, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Alert,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Logger } from '@/middleware/logger';

/**
 * Helper to get chip colors based on latest requirements
 */
const getChipColor = (type: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (type) {
    case 'Placement': return 'error';
    case 'Result': return 'warning';
    case 'Event': return 'info';
    default: return 'default';
  }
};

const NotificationCard = ({ notification, onMarkViewed }: { notification: Notification, onMarkViewed: (id: string) => void }) => {
  return (
    <Badge 
      color="error" 
      variant="dot" 
      invisible={!notification.isNew} 
      sx={{ width: '100%', mb: 2 }}
    >
      <Card sx={{ width: '100%' }}>
        <CardActionArea onClick={() => onMarkViewed(notification.id)}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Chip 
                label={notification.type} 
                size="small" 
                color={getChipColor(notification.type)}
                sx={{ fontWeight: 'bold' }}
              />
              <Typography variant="caption" color="text.secondary">
                {new Date(notification.timestamp).toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="h6" component="div" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {notification.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notification.message}
            </Typography>
            {notification.isNew && (
              <Chip 
                label="NEW" 
                size="small" 
                color="error" 
                variant="outlined" 
                sx={{ mt: 1, height: '20px', fontSize: '0.6rem' }} 
              />
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </Badge>
  );
};

export default function Home() {
  const CONTEXT = 'HomePage';
  const { 
    notifications, 
    priorityInbox, 
    loading, 
    error, 
    page, 
    setPage, 
    filters, 
    setFilters, 
    markAsViewed, 
    totalCount,
    pageSize
  } = useNotifications();

  const handleTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value === 'All' ? undefined : event.target.value;
    Logger.info(CONTEXT, `Filter changed: Type = ${value || 'All'}`);
    setFilters(prev => ({ ...prev, type: value }));
    setPage(1); // Reset to first page on filter change
  };


  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    Logger.info(CONTEXT, `Page changed to ${value}`);
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div">
            Campus Notifications — Affordmed
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Priority Inbox (Left Column / Top on Mobile) */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
              Priority Inbox
              <Chip label="Top 10" size="small" sx={{ ml: 1, bgcolor: 'secondary.main', color: 'white' }} />
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading && notifications.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : priorityInbox.length > 0 ? (
              priorityInbox.map(n => (
                <NotificationCard key={`priority-${n.id}`} notification={n} onMarkViewed={markAsViewed} />
              ))
            ) : (
              <Alert severity="info">No priority notifications found.</Alert>
            )}
          </Grid>

          {/* Main Feed (Right Column / Bottom on Mobile) */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Main Feed
              </Typography>
              
              {/* Filter Bar */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="type-filter-label">Filter by Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    value={filters.type || 'All'}
                    label="Filter by Type"
                    onChange={handleTypeChange}
                  >
                    <MenuItem value="All">All Notifications</MenuItem>
                    <MenuItem value="Placement">Placements</MenuItem>
                    <MenuItem value="Result">Results</MenuItem>
                    <MenuItem value="Event">Events</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
              </Box>
            ) : notifications.length > 0 ? (
              <>
                {notifications.map(n => (
                  <NotificationCard key={`feed-${n.id}`} notification={n} onMarkViewed={markAsViewed} />
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination 
                    count={Math.ceil(totalCount / pageSize)} 
                    page={page} 
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              </>
            ) : (
              <Alert severity="info">No notifications found for the selected filters.</Alert>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
