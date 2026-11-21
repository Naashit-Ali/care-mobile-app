import type { AgentLog, Dose, Medicine, Parent, ParentStatus } from '../types';
import { api } from './client';

type Auth = { id: string; name: string; token: string };

export const registerCaregiver = (body: { name: string; email: string; password: string }) =>
  api.post<Auth>('/caregivers', body).then((r) => r.data);

export const loginCaregiver = (body: { email: string; password: string }) =>
  api.post<Auth>('/caregivers/login', body).then((r) => r.data);

export const logoutCaregiver = () => api.post<{ ok: boolean }>('/caregivers/logout').then((r) => r.data);

export const createPairingCode = () =>
  api.post<{ code: string; expiresAt: string }>('/pairing/codes').then((r) => r.data);

export const joinAsParent = (name: string, code: string) =>
  api.post<Auth & { status: ParentStatus }>('/parents/join', { name, code }).then((r) => r.data);

export const getParentMe = () =>
  api.get<{ id: string; name: string; status: ParentStatus }>('/parents/me').then((r) => r.data);

export const signOutParent = () => api.post<{ ok: boolean }>('/parents/me/sign-out').then((r) => r.data);

export const createReconnectCode = (parentId: string) =>
  api.post<{ code: string; expiresAt: string }>(`/parents/${parentId}/reconnect-code`).then((r) => r.data);

export const listParents = () => api.get<Parent[]>('/parents').then((r) => r.data);
export const approveParent = (id: string) => api.patch<Parent>(`/parents/${id}/approve`).then((r) => r.data);
export const rejectParent = (id: string) => api.patch<Parent>(`/parents/${id}/reject`).then((r) => r.data);

export const listMedicines = (parentId: string) =>
  api.get<Medicine[]>(`/parents/${parentId}/medicines`).then((r) => r.data);

export type MedicineInput = { name: string; dose: string; times: string[]; critical: boolean };

export const createMedicine = (parentId: string, body: MedicineInput) =>
  api.post<Medicine>(`/parents/${parentId}/medicines`, body).then((r) => r.data);

export const updateMedicine = (id: string, body: Partial<MedicineInput>) =>
  api.patch<Medicine>(`/medicines/${id}`, body).then((r) => r.data);

export const deleteMedicine = (id: string) => api.delete(`/medicines/${id}`).then((r) => r.data);

export const todayDoses = (parentId: string) =>
  api.get<Dose[]>(`/parents/${parentId}/doses/today`).then((r) => r.data);

export const takeDose = (id: string) => api.post<Dose>(`/doses/${id}/take`).then((r) => r.data);

export const listAgentLogs = (parentId: string) =>
  api.get<AgentLog[]>(`/parents/${parentId}/agent-logs`).then((r) => r.data);

export const demoMissDose = (id: string) => api.post<Dose>(`/demo/doses/${id}/miss`).then((r) => r.data);
export const demoDoseInOneMinute = (medicineId: string) =>
  api.post<Dose>(`/demo/medicines/${medicineId}/dose-in-1-min`).then((r) => r.data);
export const demoRunAgent = (doseId: string) =>
  api.post<{ ok: boolean; message?: string }>(`/demo/doses/${doseId}/run-agent`).then((r) => r.data);
