import { User, Vehicle, ServiceRecord, MaintenanceRisk, Notification, HistoricalService } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api';

const getAuthHeaders = (isMultipart = false) => {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fleetguard_token');
    if (token && token !== 'undefined' && token !== 'null') {
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
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('fleetguard_token');
      localStorage.removeItem('fleetguard_user');
    }
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
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await handleResponse<any>(res);

        const token = data.token || data.accessToken;
        const user = data.user || data.data?.user || data;

        if (!token) {
          throw new Error('Authentication failed: No token received from server.');
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

    // Fixed Google Sign-In method with network error handling
    googleLogin: async (credential: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        const data = await handleResponse<any>(res);

        const token = data.token || data.accessToken;
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

        const token = data.token || data.accessToken;
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
      } catch (error) {
        console.warn('Unable to verify user with backend, falling back to local session:', error);
        return api.auth.getLocalUser();
      }
    },

    getUsers: async (role?: string, status?: string) => {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      const url = `${API_BASE_URL}/auth/users${params.toString() ? '?' + params.toString() : ''}`;
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
        const token = localStorage.getItem('fleetguard_token');
        return !!token && token !== 'undefined' && token !== 'null';
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
    },

    update: async (id: string, vehicleData: Partial<Vehicle>) => {
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(vehicleData),
      });
      const data = await handleResponse<{ message: string; vehicle: Vehicle }>(res);
      return data.vehicle;
    },

    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string }>(res);
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
    },

    update: async (id: string, recordData: Partial<ServiceRecord>) => {
      const res = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(recordData),
      });
      const data = await handleResponse<{ message: string; record: ServiceRecord }>(res);
      return data.record;
    },

    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string }>(res);
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
    markAllAsRead: async () => {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return await handleResponse<{ message: string; count: number }>(res);
    },
    create: async (notificationData: { user_id: string; vehicle_id?: string; title: string; message: string; notification_type?: string }) => {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notificationData),
      });
      const data = await handleResponse<{ message: string; notification: Notification }>(res);
      return data.notification;
    },
    getSettings: async () => {
      const res = await fetch(`${API_BASE_URL}/notifications/settings`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ settings: { lead_days: number[]; enable_email_alerts: boolean; enable_in_app_alerts: boolean } }>(res);
      return data.settings;
    },
    updateSettings: async (settings: { lead_days: number[]; enable_email_alerts?: boolean; enable_in_app_alerts?: boolean }) => {
      const res = await fetch(`${API_BASE_URL}/notifications/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
      return handleResponse<{ message: string; settings: any }>(res);
    },
    triggerExpiryScan: async () => {
      const res = await fetch(`${API_BASE_URL}/notifications/trigger-expiry-scan`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string; details: any }>(res);
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
    getVehicleStatus: async (vehicleId: string) => {
      const res = await fetch(`${API_BASE_URL}/compliance/vehicle/${vehicleId}/status`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<{
        vehicle_id: string;
        overall_status: 'Compliant' | 'Non-Compliant';
        expired_documents?: any[];
        missing_documents?: string[];
        documents?: any[];
      }>(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/compliance/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string; document: any }>(res);
    },
  },

  assignments: {
    getAll: async (params?: { status?: string; vehicle_id?: string; driver_id?: string }) => {
      let url = `${API_BASE_URL}/assignments`;
      if (params) {
        const query = new URLSearchParams(params as any).toString();
        url += `?${query}`;
      }
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ assignments: any[] }>(res);
      return data.assignments;
    },
    create: async (assignmentData: {
      vehicle_id: string;
      driver_id: string;
      return_date?: string;
      override_used?: boolean;
      override_log_id?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData),
      });
      return handleResponse<{ message: string; assignment: any }>(res);
    },
    returnVehicle: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/assignments/${id}/return`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string; assignment: any }>(res);
    },
    cancelAssignment: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/assignments/${id}/cancel`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string; assignment: any }>(res);
    }
  },

  overrideLogs: {
    create: async (overrideData: { vehicle_id: string; reason: string; approval_status?: string }) => {
      const res = await fetch(`${API_BASE_URL}/override-logs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(overrideData),
      });
      return handleResponse<{ success: boolean; message: string; overrideLog: any }>(res);
    },
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/override-logs`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ success: boolean; overrideLogs: any[] }>(res);
      return data.overrideLogs;
    }
  },

  checklists: {
    create: async (checklistData: {
      vehicle_id: string;
      tyres_ok: boolean;
      brakes_ok: boolean;
      lights_ok: boolean;
      horn_ok: boolean;
      mirrors_ok: boolean;
      remarks?: string;
      status?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/checklists`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checklistData),
      });
      return handleResponse<{ success: boolean; message: string; checklist: any }>(res);
    },
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/checklists`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ checklists: any[] }>(res);
      return data.checklists;
    },
    getMyChecklists: async () => {
      const res = await fetch(`${API_BASE_URL}/checklists/my`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ checklists: any[] }>(res);
      return data.checklists;
    },
    getByVehicle: async (vehicleId: string) => {
      const res = await fetch(`${API_BASE_URL}/checklists/vehicle/${vehicleId}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ checklists: any[] }>(res);
      return data.checklists;
    }
  },

  driver: {
    updateStatus: async (id: string, status: 'Active' | 'Rejected') => {
      const res = await fetch(`${API_BASE_URL}/drivers/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse<{ message: string; driver: any }>(res);
    }
  },

  serviceQueue: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/maintenance/service-queue`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ success?: boolean; data?: any[]; queue?: any[] } | any[]>(res);
      if (Array.isArray(data)) return data;
      return (data as any)?.data || (data as any)?.queue || [];
    }
  },

  risks: {
    getAll: async (riskLevel?: string) => {
      let url = `${API_BASE_URL}/maintenance-risks`;
      if (riskLevel) url += `?risk_level=${riskLevel}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ risks: any[] }>(res);
      return data.risks || [];
    },
    getByVehicle: async (vehicleId: string) => {
      const res = await fetch(`${API_BASE_URL}/maintenance-risks/${vehicleId}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{ risk: any }>(res);
      return data.risk;
    },
    recalculate: async (vehicle_id?: string) => {
      const res = await fetch(`${API_BASE_URL}/maintenance-risks/recalculate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ vehicle_id }),
      });
      return handleResponse<any>(res);
    }
  },

  triggerExpiryScan: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/trigger-expiry-scan`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },
  getSettings: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/settings`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ settings: any }>(res);
    return data.settings;
  },
  updateSettings: async (settings: any) => {
    const res = await fetch(`${API_BASE_URL}/notifications/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse<any>(res);
  }
};
