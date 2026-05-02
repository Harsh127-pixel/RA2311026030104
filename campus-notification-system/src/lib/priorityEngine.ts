import { Logger } from '@/middleware/logger';

export interface Notification {
  id: string;
  type: string;
  title?: string; // Optional since API might not provide it
  message: string;
  timestamp: string; // "YYYY-MM-DD HH:mm:ss"
}

const WEIGHT_MAP: Record<string, number> = {
  'Placement': 3,
  'Result': 2,
  'Event': 1,
};

/**
 * Returns a priority label based on notification type
 */
export function getWeightLabel(type: string): 'High' | 'Medium' | 'Low' {
  const weight = WEIGHT_MAP[type] || 0;
  if (weight >= 3) return 'High';
  if (weight === 2) return 'Medium';
  return 'Low';
}

/**
 * Returns a MUI color string based on notification type
 */
export function getTypeColor(type: string): 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'default' {
  const weight = WEIGHT_MAP[type] || 0;
  switch (weight) {
    case 3: return 'primary';
    case 2: return 'secondary';
    case 1: return 'info';
    default: return 'default';
  }
}

/**
 * Calculates top priority notifications based on weight and recency.
 * Score = (weight * 100) + normalizedRecency
 */
export function getTopPriorityNotifications(notifications: Notification[], topN = 10): Notification[] {
  const CONTEXT = 'PriorityEngine';
  
  if (notifications.length === 0) {
    Logger.info(CONTEXT, 'Empty notifications list provided');
    return [];
  }

  Logger.info(CONTEXT, `Processing ${notifications.length} notifications to find top ${topN}`);

  // Convert timestamps to numbers once
  const notificationsWithTime = notifications.map(n => {
    // API returns "YYYY-MM-DD HH:mm:ss". Convert to ISO "YYYY-MM-DDTHH:mm:ss" for constructor
    const isoString = n.timestamp.includes(' ') && !n.timestamp.includes('T') 
      ? n.timestamp.replace(' ', 'T') 
      : n.timestamp;
    
    return {
      ...n,
      time: new Date(isoString).getTime()
    };
  });

  const times = notificationsWithTime.map(n => n.time).filter(t => !isNaN(t));
  if (times.length === 0) {
    Logger.warn(CONTEXT, 'All notification timestamps were invalid');
    return notifications.slice(0, topN);
  }

  const newestTimestamp = Math.max(...times);
  const oldestTimestamp = Math.min(...times);
  const timeRange = newestTimestamp - oldestTimestamp;

  const scoredNotifications = notificationsWithTime.map(n => {
    const weight = WEIGHT_MAP[n.type] || 0;
    
    // Normalized recency: (itemTimestamp - oldestTimestamp) / (newestTimestamp - oldestTimestamp)
    const normalizedRecency = timeRange === 0 || isNaN(n.time) 
      ? 1 
      : (n.time - oldestTimestamp) / timeRange;
    
    const score = (weight * 100) + normalizedRecency;
    
    return { ...n, score };
  });

  // Sort descending by score
  const sorted = scoredNotifications.sort((a, b) => {
    if (isNaN(a.score)) return 1;
    if (isNaN(b.score)) return -1;
    return b.score - a.score;
  });

  Logger.success(CONTEXT, `Successfully ranked notifications. Highest score: ${sorted[0]?.score.toFixed(4)}`);

  // Return top N and remove the temporary fields
  return sorted.slice(0, topN).map(n => ({
    id: n.id,
    type: n.type,
    title: n.title || n.message.substring(0, 30), // Use message snippet if title is missing
    message: n.message,
    timestamp: n.timestamp,
  }));
}
