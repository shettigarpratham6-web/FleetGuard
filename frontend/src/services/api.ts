import { User, Vehicle, ServiceRecord, MaintenanceRisk, Notification, HistoricalService, Checklist, Assignment } from '@/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api').trim().replace(/\/+$/, '');

// Helper to ensure the token is purely the raw JWT string
const sanitizeToken = (rawToken: unknown): string => {
  if (!rawToken || typeof rawToken !== 'string') return '';

  let cleaned = rawToken.trim();

  // Remove wrapping double quotes (e.g. from JSON.stringify)
  cleaned = cleaned.replace(/^"(.*)"$/, '$1').trim();

  // Remove accidental extra "Bearer " if included in server response
  cleaned = cleaned.replace(/^Bearer\s+/i, '').trim();

  if (cleaned === 'undefined' || cleaned === 'null') return '';

  return cleaned;
};

const getAuthHeaders = (isMultipart = false) => {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const rawToken = localStorage.getItem('fleetguard_token');
    const token = sanitizeToken(rawToken);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Replace your handleResponse function in api.ts
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    console.error(`[API Error ${response.status}] Request to ${response.url} failed:`, errorMessage);

    // Don't trigger a forced browser redirect if the check was just for /auth/me
    const isAuthMeEndpoint = response.url.includes('/auth/me');

    if (response.status === 401 && typeof window !== 'undefined' && !isAuthMeEndpoint) {
      console.warn('Authentication token was rejected by backend for:', response.url);
      localStorage.removeItem('fleetguard_token');
      localStorage.removeItem('fleetguard_user');
      window.location.href = '/login';
    }

    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Auth API
  auth: {
    login: async (email: string, password: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await handleResponse<any>(res);

        const rawToken = data.token || data.accessToken || data.data?.token;
        const token = sanitizeToken(rawToken);
        const user = data.user || data.data?.user || data;

        if (!token) {
          throw new Error('Authentication failed: No valid token received from server.');
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('fleetguard_token', token);
          if (user) {
            localStorage.setItem('fleetguard_user', JSON.stringify(user));
          }
        }

        return { token, user };
      } catch (error: any) {
        if (error.message === 'Failed to fetch') {
          throw new Error('Unable to connect to the backend server. Please verify your backend API is running.');
        }
        throw error;
      }
    },

    googleLogin: async (credential: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        const data = await handleResponse<any>(res);

        const rawToken = data.token || data.accessToken || data.data?.token;
        const token = sanitizeToken(rawToken);
        const user = data.user || data.data?.user || data;

        if (!token) {
          throw new Error('Google Sign-In failed: No session token received from backend.');
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('fleetguard_token', token);
          if (user) {
            localStorage.setItem('fleetguard_user', JSON.stringify(user));
          }
        }

        return { token, user };
      } catch (error: any) {
        console.error('Google login API error:', error);
        if (error.message === 'Failed to fetch') {
          throw new Error('Unable to connect to the backend server. Please verify your API server is running on ' + API_BASE_URL);
        }
        throw error;
      }
    },

    register: async (userData: Partial<User> & { password?: string }) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
        const data = await handleResponse<any>(res);

        const rawToken = data.token || data.accessToken || data.data?.token;
        const token = sanitizeToken(rawToken);
        const user = data.user || data.data?.user || data;

        if (typeof window !== 'undefined') {
          if (token) localStorage.setItem('fleetguard_token', token);
          if (user) localStorage.setItem('fleetguard_user', JSON.stringify(user));
        }
        return { token, user };
      } catch (error: any) {
        if (error.message === 'Failed to fetch') {
          throw new Error('Unable to connect to the backend server. Please check your network connection.');
        }
        throw error;
      }
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fleetguard_token');
        localStorage.removeItem('fleetguard_user');
      }
    },

    syncGoogleUser: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      const data = await handleResponse<{ user: User }>(res);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fleetguard_user', JSON.stringify(data.user));
      }
      return data;
    },

    getCurrentUser: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        const data = await handleResponse<any>(res);
        const user = data.user || data.data?.user || data;

        if (typeof window !== 'undefined' && user) {
          localStorage.setItem('fleetguard_user', JSON.stringify(user));
        }
        return user;
      } catch (error: any) {
        // Do not fall back to local user if explicitly unauthenticated
        if (error?.message?.toLowerCase().includes('authentication required')) {
          return null;
        }
        console.warn('Unable to verify user with backend, falling back to local session:', error);
        return api.auth.getLocalUser();
      }
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
        if (userStr && userStr !== 'undefined') {
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
        const token = sanitizeToken(localStorage.getItem('fleetguard_token'));
        return !!token;
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
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const data = await handleResponse<{ notifications: Notification[] }>(res);
        return data.notifications || [];
      } catch (error) {
        console.warn('Unable to connect to notifications service:', error);
        return [];
      }
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

  compliance: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/compliance`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ documents: any[] }>(res);
      return data.documents;
    },
    create: async (formData: FormData) => {
      const headers = getAuthHeaders(true); // true = isMultipart
      const res = await fetch(`${API_BASE_URL}/compliance`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await handleResponse<{ message: string; document: any }>(res);
      return data.document;
    },
  },

  checklists: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/checklists`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ checklists: Checklist[] }>(res);
      return data.checklists || [];
    },
    getMyChecklists: async () => {
      const res = await fetch(`${API_BASE_URL}/checklists/my-checklists`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ checklists: Checklist[] }>(res);
      return data.checklists || [];
    },
    getByVehicle: async (vehicleId: string) => {
      const res = await fetch(`${API_BASE_URL}/checklists/vehicle/${vehicleId}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ checklists: Checklist[] }>(res);
      return data.checklists || [];
    },
    create: async (checklistData: Partial<Checklist>) => {
      const res = await fetch(`${API_BASE_URL}/checklists`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checklistData),
      });
      const data = await handleResponse<{ message: string; checklist: Checklist }>(res);
      return data.checklist;
    },
  },

  assignments: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/assignments`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ assignments: Assignment[] }>(res);
      return data.assignments || [];
    },
    create: async (assignmentData: { vehicle_id: string; driver_id: string; override_reason?: string }) => {
      const res = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData),
      });
      const data = await handleResponse<{ message: string; assignment: Assignment }>(res);
      return data.assignment;
    },
    returnVehicle: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/assignments/${id}/return`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    cancelAssignment: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/assignments/${id}/cancel`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },
};