import { FactScore } from './schema';

export type Role = 'principal' | 'vice_principal' | 'head_dept' | 'teacher' | 'academic_affairs' | 'qa_testing' | 'student_affairs' | 'student' | 'no_role';

export interface DataRecord extends FactScore {
    // Fields not in DB but used in UI
    status: "active" | "inactive" | "pending";
    lastUpdate: string;

    // Override optional fields from FactScore to be required as per UI requirements
    gender: string;
    race_ethnicity: string;
    parental_education: string;
    math: string;
    math_score: number;
    reading: string;
    reading_score: number;
    writing: string;
    writing_score: number;
}
