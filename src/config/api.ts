// API Configuration
// Change this when deploying to production

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE_URL}/api/login`,
    REGISTER: `${API_BASE_URL}/api/register`,

    // Students
    STUDENTS: `${API_BASE_URL}/api/students`,
    STUDENT_DETAILS: `${API_BASE_URL}/api/students`, // Default to details for backward compatibility
    STUDENT_PROVINCES: `${API_BASE_URL}/api/students/provinces`,
    STUDENT_SCHOOLS: `${API_BASE_URL}/api/students/schools`,

    // Audit Logs
    AUDIT_LOGS: `${API_BASE_URL}/api/audit-logs`,

    // Users
    USERS: `${API_BASE_URL}/api/users`,

    // Messages
    MESSAGES: `${API_BASE_URL}/api/messages`,

    // Health check
    HEALTH: `${API_BASE_URL}/api/health`,

    // Upload
    UPLOAD: `${API_BASE_URL}/api/upload`,
};

export default API_BASE_URL;
