import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import { DashboardPage } from "./pages/DashboardPage"
import { StudentListPage } from "./pages/StudentListPage"
import { LoginPage } from "./pages/LoginPage"
import { AuditLogPage } from "./pages/AuditLogPage"
import { ChatPage } from "./pages/ChatPage"
import { UsersPage } from "./pages/UsersPage"
import { canAccessAuditLogs, canManageStudents } from "./utils/roleHelpers"
import { MainLayout } from "./layouts/MainLayout"
import { useStudentData } from "./hooks/useStudentData"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function AppContent() {
    const { user } = useAuth();

    // Use the new hook for student data management
    const {
        data,
        isRefreshing,
        handleRefresh,
        handleReset,
        handleDelete,
        handleAddRecord,
        handleUpdateRecord
    } = useStudentData();

    return (
        <MainLayout>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <DashboardPage data={data} />
                    </ProtectedRoute>
                } />
                <Route
                    path="/students"
                    element={
                        <ProtectedRoute>
                            {user && canManageStudents(user.role) ? (
                                <StudentListPage
                                    data={data}
                                    onAdd={handleAddRecord}
                                    onUpdate={handleUpdateRecord}
                                    onDelete={handleDelete}
                                    onRefresh={handleRefresh}
                                    onReset={handleReset}
                                    isRefreshing={isRefreshing}
                                />
                            ) : (
                                <Navigate to="/" replace />
                            )}
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/audit-logs"
                    element={
                        <ProtectedRoute>
                            {user && canAccessAuditLogs(user.role) ? (
                                <AuditLogPage />
                            ) : (
                                <Navigate to="/" replace />
                            )}
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            {user && user.role === 'principal' ? (
                                <UsersPage />
                            ) : (
                                <Navigate to="/" replace />
                            )}
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </MainLayout>
    )
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <AppContent />
                </SocketProvider>
            </AuthProvider>
        </Router>
    )
}
