import { StudentDetail, ProvinceSummary, SchoolSummary } from './schema';

export type { StudentDetail, ProvinceSummary, SchoolSummary };

export type Role = 'principal' | 'vice_principal' | 'head_dept' | 'teacher' | 'academic_affairs' | 'qa_testing' | 'student_affairs' | 'student' | 'no_role' | 'PENDING';

export interface DataRecord extends StudentDetail {
    // Fields for UI state and compatibility
    status?: "active" | "inactive" | "pending" | string;
    lastUpdate?: string;

    // Computed or extra fields if needed for specific logic
    // (Attendance rate is already in StudentDetail)
}

export type SortDirection = "asc" | "desc" | null;

export interface ProvinceSummaryRecord extends ProvinceSummary { }
export interface SchoolSummaryRecord extends SchoolSummary { }
