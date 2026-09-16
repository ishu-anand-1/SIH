import { fetchApi } from './client';
import { User, InspectionDetail, Product, Rule, EnforcementItem, AuditLog } from '../../types';

export const api = {
  // Auth
  login: (email: string, password: string) => fetchApi<{ access_token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  getMe: () => fetchApi<User>('/auth/me'),

  // Dashboard & System
  getDashboardStats: () => fetchApi<{
    total_inspections: number;
    compliant_count: number;
    non_compliant_count: number;
    needs_review_count: number;
    weekly_trend: any[];
  }>('/dashboard/stats'),
  getSystemHealth: () => fetchApi<any>('/system/health'),

  // Inspections
  listInspections: () => fetchApi<any[]>('/inspections'),
  createInspection: (product_id: string) => {
    const formData = new FormData();
    formData.append('product_id', product_id);
    return fetch('/api/v1/inspections/new', {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
  getInspectionDetail: (id: string) => fetchApi<InspectionDetail>(`/inspections/${id}`),
  uploadInspectionImage: async (id: string, file: File) => {
    const token = localStorage.getItem('metrologyx_token');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('image_type', 'FRONT');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch('/api/v1/inspections/' + id + '/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail || ('Image upload failed: ' + res.statusText)
      );
    }

    return res.json();
  },  visionAnalyzeInspection: (id: string) =>
    fetchApi<{
      inspection_id: string;
      vision: {
        scene: string | null;
        product_name: string | null;
        brand: string | null;
        category: string | null;
        packaging_detected: boolean;
        label_detected: boolean;
        confidence: number;
        summary: string | null;
        objects: Array<{
          name: string;
          confidence: number;
          description: string;
        }>;
        visible_text_hints: Array<{
          text: string;
          confidence: number;
        }>;
        vision_model: string;
        lmcp_routing: {
          status: string;
          reason: string;
        };
      };
    }>(`/inspections/${id}/vision-analyze`, {
      method: 'POST',
    }),
  analyzeInspection: (id: string) => fetchApi<{ id: string; status: string; overall_compliance: string }>(`/inspections/${id}/analyze`, {
    method: 'POST',
  }),
  submitOfficerReview: (id: string, decision: string, remarks: string) => fetchApi<{ id: string; decision: string }>(`/inspections/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, remarks }),
  }),
  finalizeInspection: (id: string) => fetchApi<{ id: string; status: string }>(`/inspections/${id}/finalize`, {
    method: 'POST',
  }),

  // Reports
  generateReport: (id: string) => fetchApi<{ id: string; pdf_url: string; docx_url: string; json_url: string }>(`/reports/${id}/generate`, {
    method: 'POST',
  }),

  // Products
  listProducts: () => fetchApi<Product[]>('/products'),
  getProductDetail: (id: string) => fetchApi<Product>(`/products/${id}`),

  // Rules & Enforcement
  listRules: () => fetchApi<Rule[]>('/rules'),
  getEnforcementQueue: () => fetchApi<EnforcementItem[]>('/enforcement/queue'),

  // eMaap & Audit
  generateEmaapPayload: (id: string) => fetchApi<any>(`/emaap/generate-payload?inspection_id=${id}`, {
    method: 'POST',
  }),
  listAuditLogs: () => fetchApi<AuditLog[]>('/audit-logs'),
};








