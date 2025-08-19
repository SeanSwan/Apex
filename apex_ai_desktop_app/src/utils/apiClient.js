// apex_ai_desktop_app/src/utils/apiClient.js
/**
 * APEX AI API CLIENT
 * ==================
 * Centralized API client with error handling and authentication
 */

class APIError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new APIError('No authentication token found', 401, 'NO_TOKEN');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      // Parse response data
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new APIError(
          'Invalid response format from server', 
          response.status, 
          'INVALID_RESPONSE'
        );
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw new APIError(
          data.message || `HTTP Error ${response.status}`,
          response.status,
          data.code || 'HTTP_ERROR',
          data
        );
      }

      return data;
    } catch (error) {
      // Handle network errors
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new APIError(
          'Unable to connect to server. Please check your internet connection.',
          0,
          'NETWORK_ERROR'
        );
      }
      
      throw new APIError(
        'An unexpected error occurred',
        0,
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  // SOP Management
  async getSOPs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/internal/v1/sops${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getSOP(id) {
    return this.makeRequest(`/api/internal/v1/sops/${id}`);
  }

  async createSOP(sopData) {
    return this.makeRequest('/api/internal/v1/sops', {
      method: 'POST',
      body: JSON.stringify(sopData)
    });
  }

  async updateSOP(id, sopData) {
    return this.makeRequest(`/api/internal/v1/sops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sopData)
    });
  }

  async deleteSOP(id) {
    return this.makeRequest(`/api/internal/v1/sops/${id}`, {
      method: 'DELETE'
    });
  }

  // Contact Lists
  async getContactLists(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/internal/v1/contact-lists${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getContactList(id) {
    return this.makeRequest(`/api/internal/v1/contact-lists/${id}`);
  }

  async createContactList(contactListData) {
    return this.makeRequest('/api/internal/v1/contact-lists', {
      method: 'POST',
      body: JSON.stringify(contactListData)
    });
  }

  async updateContactList(id, contactListData) {
    return this.makeRequest(`/api/internal/v1/contact-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactListData)
    });
  }

  async deleteContactList(id) {
    return this.makeRequest(`/api/internal/v1/contact-lists/${id}`, {
      method: 'DELETE'
    });
  }

  async testNotifications(notificationData) {
    return this.makeRequest('/api/internal/v1/contact-lists/test-notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });
  }

  // Properties
  async getProperties(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/internal/v1/properties${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getProperty(id) {
    return this.makeRequest(`/api/internal/v1/properties/${id}`);
  }

  async getPropertyIncidents(id, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/internal/v1/properties/${id}/incidents${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Guards
  async getGuards(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/internal/v1/guards${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getGuard(id) {
    return this.makeRequest(`/api/internal/v1/guards/${id}`);
  }

  async getGuardsOnDuty(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/internal/v1/guards/on-duty${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async dispatchGuard(id, dispatchData) {
    return this.makeRequest(`/api/internal/v1/guards/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(dispatchData)
    });
  }

  async updateGuardStatus(id, statusData) {
    return this.makeRequest(`/api/internal/v1/guards/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
  }
}

// Create and export singleton instance
const apiClient = new APIClient();

export { APIClient, APIError, apiClient };
export default apiClient;
