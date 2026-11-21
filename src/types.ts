export type Role = 'caregiver' | 'parent';
export type ParentStatus = 'pending' | 'active' | 'rejected';
export type DoseStatus = 'pending' | 'taken' | 'missed';

export type Session = { role: Role; id: string; token: string; name: string };

export type Parent = {
  _id: string;
  name: string;
  caregiverId: string;
  status: ParentStatus;
  createdAt: string;
  signedOutAt?: string;
};

export type ParentSignedOut = { parentId: string; name: string; withdrawn: boolean };
export type ParentReconnected = { parentId: string; name: string };

export type Medicine = {
  _id: string;
  parentId: string;
  name: string;
  dose: string;
  times: string[];
  critical: boolean;
};

export type Dose = {
  _id: string;
  medicineId: string;
  parentId: string;
  caregiverId: string;
  medicineName: string;
  dose: string;
  critical: boolean;
  date: string;
  scheduledAt: string;
  status: DoseStatus;
  takenAt?: string;
  missedAt?: string;
};

export type MissedDose = Dose & { parentName: string };
export type TakenDose = Dose & { parentName: string; late: boolean };

export type AgentLogType = 'thought' | 'tool_call' | 'result';
export type AgentLog = {
  _id: string;
  parentId: string;
  caregiverId: string;
  doseId?: string;
  type: AgentLogType;
  tool?: string;
  message: string;
  createdAt: string;
};

export type AgentRemind = { message: string; doseId: string; medicineName: string };
export type AgentAlert = {
  parentId: string;
  parentName: string;
  doseId: string;
  medicineName: string;
  summary: string;
  urgency: 'low' | 'medium' | 'high';
  critical: boolean;
};
