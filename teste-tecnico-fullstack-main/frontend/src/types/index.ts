export type UserRole = 'super_admin' | 'owner' | 'user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  invitedBy?: { name: string; email: string };
  organization?: { id: string; name: string };
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type FileType = 'text' | 'image';

export interface DriveFile {
  id: string;
  originalName: string;
  storedName: string;
  filePath: string;
  type: FileType;
  size: number;
  mimeType: string;
  organizationId: string;
  uploadedById: string;
  uploadedBy: OrgMember;
  uploadedAt: string;
  isShared?: boolean;
}

export interface FileShare {
  id: string;
  fileId: string;
  sharedById: string;
  sharedWithId: string;
  sharedWith: OrgMember;
  createdAt: string;
}

export interface SuperAdminStats {
  totalOrganizations: number;
  totalOwnerInvitations: number;
  acceptedOwnerInvitations: number;
  acceptanceRate: number;
}

export interface OwnerStats {
  totalInvitations: number;
  acceptedInvitations: number;
  pendingInvitations: number;
}
