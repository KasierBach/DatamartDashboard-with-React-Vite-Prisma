import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LayoutDashboard, Users, GraduationCap, LogOut, User, ChevronDown, Mail, Phone, History, Shield, Settings, MessageCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getRoleDisplayName, getRoleBadgeColor, canAccessAuditLogs, canManageStudents } from "@/utils/roleHelpers"
import { ProfileDialog } from "@/components/ProfileDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Toaster } from "@/components/ui/sonner"

function NavLink({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon: any }) {
    const location = useLocation()
    const isActive = location.pathname === to

    return (
        <Link
            to={to}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
                }`}
        >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{children}</span>
        </Link>
    )
}

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [profileOpen, setProfileOpen] = useState(false)
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Toaster richColors position="top-right" />

            {/* Navbar */}
            {user && (
                <header className="border-b bg-card">
                    <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2 font-bold text-xl">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <span>Student's Datamart</span>
                            </div>

                            <nav className="hidden md:flex items-center gap-2">
                                <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
                                {canManageStudents(user.role) && (
                                    <NavLink to="/students" icon={Users}>Students</NavLink>
                                )}
                                {canAccessAuditLogs(user.role) && (
                                    <NavLink to="/audit-logs" icon={History}>Logs</NavLink>
                                )}
                                {user.role === 'principal' && (
                                    <NavLink to="/users" icon={Shield}>Users</NavLink>
                                )}
                                <NavLink to="/chat" icon={MessageCircle}>Chat</NavLink>
                            </nav>

                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />

                            {/* User Account Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors border">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-medium leading-tight">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.username}</p>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                                                </div>
                                            </div>
                                            <div className="pt-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleDisplayName(user.role)}
                                                </span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                                        <span>Vai trò: {getRoleDisplayName(user.role)}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                                        <span>Username: {user.username}</span>
                                    </DropdownMenuItem>
                                    {user.email && (
                                        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                                            <Mail className="h-3 w-3 mr-2" />
                                            <span>{user.email}</span>
                                        </DropdownMenuItem>
                                    )}
                                    {user.phone && (
                                        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                                            <Phone className="h-3 w-3 mr-2" />
                                            <span>{user.phone}</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                                        <Settings className="h-4 w-4 mr-2" />
                                        <span>Cài đặt tài khoản</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="text-red-600 dark:text-red-400 cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        <span>Đăng xuất</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-7xl">
                    {children}
                </div>
            </main>
            <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
        </div>
    )
}
