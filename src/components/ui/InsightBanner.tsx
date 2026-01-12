import { cn } from "@/lib/utils";
import { LucideIcon, Info, AlertTriangle, Trophy, Activity, BookOpen, Users, User } from "lucide-react";

export type InsightVariant = "info" | "warning" | "success" | "purple" | "teal" | "orange" | "sky";

interface InsightBannerProps {
    variant?: InsightVariant;
    icon?: LucideIcon;
    title: string;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<InsightVariant, { bg: string; border: string; titleColor: string; textColor: string; defaultIcon: LucideIcon }> = {
    info: {
        bg: "bg-blue-50",
        border: "border-blue-500",
        titleColor: "text-blue-800",
        textColor: "text-blue-700",
        defaultIcon: Info,
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-500",
        titleColor: "text-amber-800",
        textColor: "text-amber-700",
        defaultIcon: AlertTriangle,
    },
    success: {
        bg: "bg-green-50",
        border: "border-green-500",
        titleColor: "text-green-800",
        textColor: "text-green-700",
        defaultIcon: Trophy,
    },
    purple: {
        bg: "bg-purple-50",
        border: "border-purple-500",
        titleColor: "text-purple-800",
        textColor: "text-purple-700",
        defaultIcon: Activity,
    },
    teal: {
        bg: "bg-teal-50",
        border: "border-teal-500",
        titleColor: "text-teal-800",
        textColor: "text-teal-700",
        defaultIcon: BookOpen,
    },
    orange: {
        bg: "bg-orange-50",
        border: "border-orange-500",
        titleColor: "text-orange-800",
        textColor: "text-orange-700",
        defaultIcon: Users,
    },
    sky: {
        bg: "bg-sky-50",
        border: "border-sky-500",
        titleColor: "text-sky-800",
        textColor: "text-sky-700",
        defaultIcon: User,
    },
};

export function InsightBanner({ variant = "info", icon, title, children, className }: InsightBannerProps) {
    const styles = variantStyles[variant];
    const IconComponent = icon || styles.defaultIcon;

    return (
        <div className={cn(styles.bg, "border-l-4", styles.border, "p-4 rounded shadow-sm flex items-start", className)}>
            <IconComponent className={cn("h-6 w-6 mt-1 mr-3 flex-shrink-0", styles.titleColor.replace("text-", "text-"))} />
            <div>
                <h3 className={cn("text-lg font-bold", styles.titleColor)}>{title}</h3>
                <div className={cn("mt-1", styles.textColor)}>{children}</div>
            </div>
        </div>
    );
}
