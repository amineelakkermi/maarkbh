// ─────────────────────────────────────────────────────────────
//  Maarkbh · مركبة — API Services
//  Service layer for API endpoints organized by module
// ─────────────────────────────────────────────────────────────

import { apiClient } from './api-client';
import * as Types from './api-types';

// ─── Authorization Service ─────────────────────────────────────

export const authService = {
  /**
   * Authenticate user and get access token
   * POST /connect/token
   */
  async login(credentials: Types.TokenRequest): Promise<Types.TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('grant_type', credentials.grant_type);
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    // Use Next.js API route as proxy to avoid CORS
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error_description || errorData?.error || errorData?.details || 'Authentication failed');
    }

    const data = await response.json();

    // Store token in client
    if (data.access_token) {
      apiClient.setToken(data.access_token);
    }

    return data;
  },

  /**
   * Logout user and clear token
   */
  logout(): void {
    apiClient.setToken(null);
  },

  /**
   * Get current access token
   */
  getToken(): string | null {
    return apiClient.getToken();
  },

  /**
   * Refresh access token using refresh token
   * POST /connect/token
   */
  async refreshToken(credentials: Types.RefreshTokenRequest): Promise<Types.TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('grant_type', credentials.grant_type);
    formData.append('refresh_token', credentials.refresh_token);

    // Use Next.js API route as proxy to avoid CORS
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error_description || errorData?.error || 'Token refresh failed');
    }

    const data = await response.json();
    
    // Store token in client
    if (data.access_token) {
      apiClient.setToken(data.access_token);
    }

    return data;
  },
};

// ─── Account Service ───────────────────────────────────────────

export const accountService = {
  /**
   * Change user password
   * POST /api/account/change-password
   */
  async changePassword(request: Types.ChangePasswordRequest): Promise<void> {
    // Get token from sessionStorage (same as AuthContext)
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('mk_token') : null;
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to change password');
    }
  },
};

// ─── Customer Service ───────────────────────────────────────────

export const customerService = {
  /**
   * Search customers
   * POST /api/customers/search
   */
  async search(request: Types.CustomerSearchRequest): Promise<any> {
    return apiClient.request('/customers/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Get customer by ID
   * GET /api/customers/{id}
   */
  async getById(id: number): Promise<any> {
    return apiClient.request(`/customers/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create new customer
   * POST /api/customers
   */
  async create(request: Types.CreateCustomerCommand): Promise<any> {
    return apiClient.request('/customers', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update customer
   * PUT /api/customers/{id}
   */
  async update(id: number, request: Types.UpdateCustomerRequest): Promise<any> {
    return apiClient.request(`/customers/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete customer
   * DELETE /api/customers/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get identity types
   * GET /api/customers/identity-types
   */
  async getIdentityTypes(): Promise<any> {
    return apiClient.request('/customers/identity-types', {
      method: 'GET',
    });
  },

  /**
   * Get verification statuses
   * GET /api/customers/verification-statuses
   */
  async getVerificationStatuses(): Promise<any> {
    return apiClient.request('/customers/verification-statuses', {
      method: 'GET',
    });
  },

  /**
   * Get tajeer statuses
   * GET /api/customers/tajeer-statuses
   */
  async getTajeerStatuses(): Promise<any> {
    return apiClient.request('/customers/tajeer-statuses', {
      method: 'GET',
    });
  },

  /**
   * Get document types
   * GET /api/customers/document-types
   */
  async getDocumentTypes(): Promise<any> {
    return apiClient.request('/customers/document-types', {
      method: 'GET',
    });
  },

  /**
   * Verify customer
   * POST /api/customers/{id}/verification/verify
   */
  async verify(id: number): Promise<void> {
    await apiClient.request(`/customers/${id}/verification/verify`, {
      method: 'POST',
    });
  },

  /**
   * Reject customer verification
   * POST /api/customers/{id}/verification/reject
   */
  async rejectVerification(id: number, request: Types.CustomerReasonRequest): Promise<void> {
    await apiClient.request(`/customers/${id}/verification/reject`, {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Add customer to blacklist
   * POST /api/customers/{id}/blacklist
   */
  async addToBlacklist(id: number, request: Types.CustomerReasonRequest): Promise<void> {
    await apiClient.request(`/customers/${id}/blacklist`, {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Remove customer from blacklist
   * DELETE /api/customers/{id}/blacklist
   */
  async removeFromBlacklist(id: number): Promise<void> {
    await apiClient.request(`/customers/${id}/blacklist`, {
      method: 'DELETE',
    });
  },
};

// ─── Branch Service ─────────────────────────────────────────────

export const branchService = {
  /**
   * Search branches
   * POST /api/branches/search
   */
  async search(request: Types.BranchSearchRequest): Promise<any> {
    return apiClient.request('/branches/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Get branch by ID
   * GET /api/branches/{id}
   */
  async getById(id: number): Promise<any> {
    return apiClient.request(`/branches/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create new branch
   * POST /api/branches
   */
  async create(request: Types.CreateBranchCommand): Promise<any> {
    return apiClient.request('/branches', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update branch
   * PUT /api/branches/{id}
   */
  async update(id: number, request: Types.UpdateBranchRequest): Promise<any> {
    return apiClient.request(`/branches/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete branch
   * DELETE /api/branches/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/branches/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Country Service ────────────────────────────────────────────

export const countryService = {
  /**
   * Search countries
   * POST /api/countries/search
   */
  async search(request: Types.CountrySearchRequest): Promise<any> {
    return apiClient.request('/api/countries/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create new country
   * POST /api/countries
   */
  async create(request: Types.CreateCountryRequest): Promise<any> {
    return apiClient.request('/api/countries', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update country
   * PUT /api/countries/{id}
   */
  async update(id: number, request: Types.UpdateCountryRequest): Promise<any> {
    return apiClient.request(`/api/countries/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete country
   * DELETE /api/countries/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/api/countries/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Vehicle Service ────────────────────────────────────────────

export const vehicleService = {
  /**
   * Search vehicles
   * POST /api/vehicles/search
   */
  async search(request: Types.VehicleSearchRequest): Promise<any> {
    return apiClient.request('/vehicles/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Get vehicle by ID
   * GET /api/vehicles/{id}
   */
  async getById(id: number): Promise<any> {
    return apiClient.request(`/vehicles/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create new vehicle
   * POST /api/vehicles (id: null)
   */
  async create(request: Types.VehicleRequest): Promise<any> {
    return apiClient.request('/vehicles', {
      method: 'POST',
      body: { ...request, id: null },
    });
  },

  /**
   * Update existing vehicle
   * POST /api/vehicles (id: non-null) — same endpoint, distinguished by id in body.
   */
  async update(id: number, request: Types.VehicleRequest): Promise<any> {
    return apiClient.request('/vehicles', {
      method: 'POST',
      body: { ...request, id },
    });
  },

  /**
   * Search vehicles picker
   * POST /api/vehicles/picker
   */
  async picker(request: any): Promise<any> {
    return apiClient.request('/vehicles/picker', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Delete vehicle
   * DELETE /api/vehicles/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Attachment Service ────────────────────────────────────────

export const attachmentService = {
  /**
   * Upload single file
   * POST /api/attachments/upload
   */
  async upload(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.request('/api/attachments/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Upload multiple files
   * POST /api/attachments/upload-multi
   */
  async uploadMultiple(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    return apiClient.request('/api/attachments/upload-multi', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Get attachment by ID
   * GET /api/attachments/{id}
   */
  async getById(id: number): Promise<any> {
    return apiClient.request(`/api/attachments/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Download attachment
   * GET /api/attachments/{id}/download
   */
  async download(id: number): Promise<Blob> {
    const response = await fetch(`${apiClient['baseUrl']}/api/attachments/${id}/download`, {
      headers: {
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  },
};

// ─── Admin Tenant Service ───────────────────────────────────────

export const adminTenantService = {
  /**
   * Get users for a tenant
   * GET /api/admin/tenants/{tenantId}/users
   */
  async getUsers(tenantId: number, pageNumber?: number, pageSize?: number): Promise<any> {
    const params: Record<string, number> = {};
    if (pageNumber !== undefined) params.PageNumber = pageNumber;
    if (pageSize !== undefined) params.PageSize = pageSize;

    return apiClient.request(`/api/admin/tenants/${tenantId}/users`, {
      method: 'GET',
      params,
    });
  },

  /**
   * Create user for a tenant
   * POST /api/admin/tenants/{tenantId}/users
   */
  async createUser(tenantId: number, request: Types.CreateTenantUserRequest): Promise<any> {
    return apiClient.request(`/api/admin/tenants/${tenantId}/users`, {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Get user by ID
   * GET /api/admin/tenants/{tenantId}/users/{userId}
   */
  async getUserById(tenantId: number, userId: number): Promise<any> {
    return apiClient.request(`/api/admin/tenants/${tenantId}/users/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Update user
   * PUT /api/admin/tenants/{tenantId}/users/{userId}
   */
  async updateUser(tenantId: number, userId: number, request: Types.UpdateTenantUserRequest): Promise<any> {
    return apiClient.request(`/api/admin/tenants/${tenantId}/users/${userId}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Get roles for a tenant
   * GET /api/admin/tenants/{tenantId}/roles
   */
  async getRoles(tenantId: number, pageNumber?: number, pageSize?: number): Promise<any> {
    const params: Record<string, number> = {};
    if (pageNumber !== undefined) params.PageNumber = pageNumber;
    if (pageSize !== undefined) params.PageSize = pageSize;

    return apiClient.request(`/api/admin/tenants/${tenantId}/roles`, {
      method: 'GET',
      params,
    });
  },
};

// ─── Vehicle Makes Service ───────────────────────────────────────

export const vehicleMakeService = {
  /**
   * Search vehicle makes
   * POST /api/vehicle-makes/search
   */
  async search(request: Types.VehicleLookupSearchRequest): Promise<any> {
    return apiClient.request('/vehicle-makes/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create new vehicle make
   * POST /api/vehicle-makes
   */
  async create(request: Types.CreateVehicleLookupRequest): Promise<any> {
    return apiClient.request('/vehicle-makes', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update vehicle make
   * PUT /api/vehicle-makes/{id}
   */
  async update(id: number, request: Types.UpdateVehicleLookupRequest): Promise<any> {
    return apiClient.request(`/vehicle-makes/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete vehicle make
   * DELETE /api/vehicle-makes/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/vehicle-makes/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Vehicle Models Service ──────────────────────────────────────

export const vehicleModelService = {
  /**
   * Search vehicle models
   * POST /api/vehicle-models/search
   */
  async search(request: Types.VehicleLookupSearchRequest): Promise<any> {
    return apiClient.request('/vehicle-models/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create new vehicle model
   * POST /api/vehicle-models
   */
  async create(request: any): Promise<any> {
    return apiClient.request('/vehicle-models', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update vehicle model
   * PUT /api/vehicle-models/{id}
   */
  async update(id: number, request: any): Promise<any> {
    return apiClient.request(`/vehicle-models/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete vehicle model
   * DELETE /api/vehicle-models/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/vehicle-models/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Plate Type Service ────────────────────────────────────────────

export const plateTypeService = {
  /**
   * Search plate types
   * POST /api/plate-types/search
   */
  async search(request: Types.VehicleLookupSearchRequest): Promise<any> {
    return apiClient.request('/plate-types/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create new plate type
   * POST /api/plate-types
   */
  async create(request: Types.CreateVehicleLookupRequest): Promise<any> {
    return apiClient.request('/plate-types', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update plate type
   * PUT /api/plate-types/{id}
   */
  async update(id: number, request: Types.UpdateVehicleLookupRequest): Promise<any> {
    return apiClient.request(`/plate-types/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete plate type
   * DELETE /api/plate-types/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/plate-types/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Insurance Company Service ─────────────────────────────────────

export const insuranceCompanyService = {
  /**
   * Search insurance companies
   * POST /api/insurance-companies/search
   */
  async search(request: Types.VehicleLookupSearchRequest): Promise<any> {
    return apiClient.request('/insurance-companies/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create new insurance company
   * POST /api/insurance-companies
   */
  async create(request: Types.CreateVehicleLookupRequest): Promise<any> {
    return apiClient.request('/insurance-companies', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update insurance company
   * PUT /api/insurance-companies/{id}
   */
  async update(id: number, request: Types.UpdateVehicleLookupRequest): Promise<any> {
    return apiClient.request(`/insurance-companies/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete insurance company
   * DELETE /api/insurance-companies/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/insurance-companies/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Insurance Type Service ─────────────────────────────────────────

export const insuranceTypeService = {
  /**
   * Search insurance types
   * POST /api/insurance-types/search
   */
  async search(request: Types.VehicleLookupSearchRequest): Promise<any> {
    return apiClient.request('/insurance-types/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create new insurance type
   * POST /api/insurance-types
   */
  async create(request: Types.CreateVehicleLookupRequest): Promise<any> {
    return apiClient.request('/insurance-types', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update insurance type
   * PUT /api/insurance-types/{id}
   */
  async update(id: number, request: Types.UpdateVehicleLookupRequest): Promise<any> {
    return apiClient.request(`/insurance-types/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete insurance type
   * DELETE /api/insurance-types/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/insurance-types/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Vehicle Feature Types Service ────────────────────────────────

export const vehicleFeatureTypeService = {
  /**
   * Search vehicle feature types
   * POST /api/vehicle-feature-types/search
   */
  async search(request: Types.VehicleLookupSearchRequest): Promise<any> {
    return apiClient.request('/vehicle-feature-types/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create new vehicle feature type
   * POST /api/vehicle-feature-types
   */
  async create(request: Types.CreateVehicleLookupRequest): Promise<any> {
    return apiClient.request('/vehicle-feature-types', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Update vehicle feature type
   * PUT /api/vehicle-feature-types/{id}
   */
  async update(id: number, request: Types.UpdateVehicleLookupRequest): Promise<any> {
    return apiClient.request(`/vehicle-feature-types/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete vehicle feature type
   * DELETE /api/vehicle-feature-types/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/vehicle-feature-types/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── Tenant Users Service ─────────────────────────────────────────

export const tenantUserService = {
  /**
   * Get tenant users
   * GET /api/tenant/users
   */
  async getUsers(pageNumber?: number, pageSize?: number): Promise<any> {
    const params: Record<string, number> = {};
    if (pageNumber !== undefined) params.PageNumber = pageNumber;
    if (pageSize !== undefined) params.PageSize = pageSize;

    return apiClient.request('/tenant/users', {
      method: 'GET',
      params,
    });
  },

  /**
   * Create tenant user
   * POST /api/tenant/users
   */
  async create(request: Types.CreateTenantUserRequest): Promise<any> {
    return apiClient.request('/tenant/users', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Get tenant user by ID
   * GET /api/tenant/users/{userId}
   */
  async getById(userId: number): Promise<any> {
    return apiClient.request(`/tenant/users/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Update tenant user
   * PUT /api/tenant/users/{userId}
   */
  async update(userId: number, request: Types.UpdateTenantUserRequest): Promise<any> {
    return apiClient.request(`/tenant/users/${userId}`, {
      method: 'PUT',
      body: request,
    });
  },
};

// ─── Tenant Roles Service ─────────────────────────────────────────

export const tenantRoleService = {
  /**
   * Search tenant roles
   * POST /api/tenant/roles/search
   */
  async search(request: any): Promise<any> {
    return apiClient.request('/tenant/roles/search', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Create tenant role
   * POST /api/tenant/roles
   */
  async create(request: any): Promise<any> {
    return apiClient.request('/tenant/roles', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Get tenant role by ID
   * GET /api/tenant/roles/{id}
   */
  async getById(id: number): Promise<any> {
    return apiClient.request(`/tenant/roles/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Update tenant role
   * PUT /api/tenant/roles/{id}
   */
  async update(id: number, request: any): Promise<any> {
    return apiClient.request(`/tenant/roles/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  /**
   * Delete tenant role
   * DELETE /api/tenant/roles/{id}
   */
  async delete(id: number): Promise<void> {
    await apiClient.request(`/tenant/roles/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get roles lookup
   * GET /api/tenant/roles/lookup
   */
  async lookup(): Promise<any> {
    return apiClient.request('/tenant/roles/lookup', {
      method: 'GET',
    });
  },

  /**
   * Get permissions
   * GET /api/tenant/roles/get-permissions
   */
  async getPermissions(): Promise<any> {
    return apiClient.request('/tenant/roles/get-permissions', {
      method: 'GET',
    });
  },

  /**
   * Check if role name exists
   * GET /api/tenant/roles/name-exists/{name}/{roleId}
   */
  async nameExists(name: string, roleId: number): Promise<any> {
    return apiClient.request(`/tenant/roles/name-exists/${name}/${roleId}`, {
      method: 'GET',
    });
  },
};

// ─── Lookup Service ─────────────────────────────────────────────

export const lookupService = {
  /**
   * Get lookup context
   * POST /api/lookups/context
   */
  async getContext(request: Types.SystemLookupContextRequest): Promise<any> {
    return apiClient.request('/api/lookups/context', {
      method: 'POST',
      body: request,
    });
  },
};
