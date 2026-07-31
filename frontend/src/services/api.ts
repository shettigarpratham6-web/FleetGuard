import { User, Vehicle, ServiceRecord, MaintenanceRisk, Notification, HistoricalService } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (isMultipart = false) => {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fleetguard_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Auth API
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse<{ token: string; user: User }>(res);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fleetguard_token', data.token);
        localStorage.setItem('fleetguard_user', JSON.stringify(data.user));
      }
      return data;
    },

    register: async (userData: Partial<User> & { password?: string }) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await handleResponse<{ token: string; user: User }>(res);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fleetguard_token', data.token);
        localStorage.setItem('fleetguard_user', JSON.stringify(data.user));
      }
      return data;
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fleetguard_token');
        localStorage.removeItem('fleetguard_user');
      }
    },

    getCurrentUser: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ user: User }>(res);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fleetguard_user', JSON.stringify(data.user));
      }
      return data.user;
    },

    getUsers: async (role?: string) => {
      const url = role ? `${API_BASE_URL}/auth/users?role=${role}` : `${API_BASE_URL}/auth/users`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ users: User[] }>(res);
      return data.users;
    },

    getLocalUser: (): User | null => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('fleetguard_user');
        if (userStr) {
          try {
            return JSON.parse(userStr);
          } catch {
            return null;
          }
        }
      }
      return null;
    },

    isAuthenticated: (): boolean => {
      if (typeof window !== 'undefined') {
        return !!localStorage.getItem('fleetguard_token');
      }
      return false;
    }
  },

  // Vehicles API
  vehicles: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ vehicles: Vehicle[] }>(res);
      return data.vehicles;
    },

    getById: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ vehicle: Vehicle & { compliance_documents?: any[] } }>(res);
      return data.vehicle;
    },

    create: async (vehicleData: Partial<Vehicle>) => {
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(vehicleData),
      });
      const data = await handleResponse<{ message: string; vehicle: Vehicle }>(res);
      return data.vehicle;
    }
  },
  // Branches API
  branches: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/branches`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await handleResponse<{ branches: any[] }>(res);
      return data.branches;
    },

    getById: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await handleResponse<{ branch: any }>(res);
      return data.branch;
    },
  },
  // Services API
  services: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/services`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ records: ServiceRecord[] }>(res);
      return data.records;
    },

    getByVehicle: async (vehicleId: string) => {
      const res = await fetch(`${API_BASE_URL}/services/vehicle/${vehicleId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ records: ServiceRecord[] }>(res);
      return data.records;
    },

    create: async (recordData: Partial<ServiceRecord>) => {
      const res = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recordData),
      });
      const data = await handleResponse<{ message: string; record: ServiceRecord }>(res);
      return data.record;
    }
  },

  // Risks API
  risks: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/maintenance-risks`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ risks: MaintenanceRisk[] }>(res);
      return data.risks;
    },

    getByVehicle: async (vehicleId: string) => {
      const res = await fetch(`${API_BASE_URL}/maintenance-risks/vehicle/${vehicleId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ risks: MaintenanceRisk[] }>(res);
      return data.risks;
    }
  },

  // Notifications API
  notifications: {
    getMyNotifications: async () => {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ notifications: Notification[] }>(res);
      return data.notifications;
    },
    markAsRead: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return await handleResponse<{ message: string; notification: Notification }>(res);
    },
    create: async (notificationData: { user_id: string; vehicle_id?: string; title: string; message: string; notification_type?: string }) => {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notificationData),
      });
      const data = await handleResponse<{ message: string; notification: Notification }>(res);
      return data.notification;
    }
  },

  historicalServices: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/historical-services`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    getByVehicle: async (vehicleId: string) => {
      const res = await fetch(`${API_BASE_URL}/historical-services/vehicle/${vehicleId}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/historical-services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },
};
