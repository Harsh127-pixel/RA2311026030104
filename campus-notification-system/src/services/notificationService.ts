import { Logger } from '@/middleware/logger';
import { Notification } from '@/lib/priorityEngine';

export interface FetchParams {
  type?: string;
  tags?: string[];
  notification_type?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse {
  notifications: Notification[];
  total?: number;
  page?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
  };
}

export async function fetchNotifications(params: FetchParams): Promise<ApiResponse> {
  const CONTEXT = 'NotificationService';
  
  if (!BASE_URL) {
    const errorMsg = 'NEXT_PUBLIC_API_BASE is not defined in environment variables';
    Logger.error(CONTEXT, errorMsg);
    throw new Error(errorMsg);
  }

  const url = new URL(BASE_URL, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  if (params.type) {
    url.searchParams.append('notification_type', params.type);
  }
  
  if (params.page) url.searchParams.append('page', params.page.toString());
  if (params.limit) url.searchParams.append('limit', params.limit.toString());

  Logger.info(CONTEXT, `Fetching notifications from: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    
    interface RawNotification {
      ID?: string;
      Type?: string;
      Message?: string;
      Timestamp?: string;
      id?: string;
      type?: string;
      message?: string;
      timestamp?: string;
    }

    const notifications = (rawData.notifications || []).map((n: RawNotification) => ({
      id: n.ID || n.id || '',
      type: n.Type || n.type || '',
      message: n.Message || n.message || '',
      timestamp: n.Timestamp || n.timestamp || '',
    }));

    const data: ApiResponse = {
      ...rawData,
      notifications
    };
    
    if (data.notifications && data.notifications.length > 0) {
      Logger.debug(CONTEXT, 'Mapped notification sample:', data.notifications[0]);
    }
    
    Logger.success(CONTEXT, `Successfully fetched ${data.notifications?.length || 0} notifications`);
    
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    Logger.error(CONTEXT, `Failed to fetch notifications: ${message}`);
    throw error;
  }
}
