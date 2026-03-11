import type { ReleaseEnvironmentStatus, ReleaseApprovalStatus } from '@/types/release';
import type { SortDirection, SortOption } from '@/components/ui/sort-selector/types';

export type ReleaseSortKey = 'relevance' | 'newest' | 'name' | 'status';

export type ReleaseStatusFilter = 'all' | ReleaseEnvironmentStatus;

export interface ReleaseApprovalItem {
  id: number;
  approvalType: 'preDeploy' | 'postDeploy';
  status: ReleaseApprovalStatus;
  approverName: string;
  approverUniqueName: string;
}

export interface ReleaseEnvironmentItem {
  name: string;
  status: ReleaseEnvironmentStatus;
  lastDeployedOn?: string;
  approvals: ReleaseApprovalItem[];
}

export interface ReleaseItem {
  id: number;
  name: string;
  definitionId: number;
  definitionName: string;
  createdBy: string;
  createdOn: string;
  agoDate: string;
  environments: ReleaseEnvironmentItem[];
  url: string;
}

export interface ReleaseGroup {
  definitionId: number;
  definitionName: string;
  environmentNames: string[];
  releases: ReleaseItem[];
  isFavorite: boolean;
  isNotifyEnabled: boolean;
}

export interface ReleasesData {
  groups: ReleaseGroup[];
  sortOptions: SortOption<ReleaseSortKey>[];
  statusFilterOptions: { value: ReleaseStatusFilter; label: string }[];
  isLoading: boolean;
  error: string | null;
  definitions: string[];
  definitionFilters: string[];
  addDefinitionFilter: (d: string) => void;
  removeDefinitionFilter: (d: string) => void;
  statusFilter: ReleaseStatusFilter;
  setStatusFilter: (f: ReleaseStatusFilter) => void;
  environmentFilters: string[];
  addEnvironmentFilter: (e: string) => void;
  removeEnvironmentFilter: (e: string) => void;
  allEnvironmentNames: string[];
  countByStatus: (s: ReleaseStatusFilter) => number;
  selectedRelease: ReleaseItem | null;
  selectRelease: (release: ReleaseItem) => void;
  closeReleaseDetail: () => void;
  favorites: Set<number>;
  toggleFavorite: (definitionId: number) => void;
  toggleNotification: (definitionId: number) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (v: boolean) => void;
  approveRelease: (approvalId: number) => void;
  rejectRelease: (approvalId: number) => void;
  isApproving: boolean;
  currentUserUniqueName: string | null;
  myPendingApproval: ReleaseApprovalItem | null;
  query: string;
  setQuery: (q: string) => void;
  sortKey: ReleaseSortKey;
  sortDirection: SortDirection;
  setSort: (key: ReleaseSortKey, dir: SortDirection) => void;
}
