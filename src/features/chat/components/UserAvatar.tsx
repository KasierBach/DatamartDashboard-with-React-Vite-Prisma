import { cn } from '@/lib/utils';
import React from 'react';
import API_BASE_URL from '@/config/api';
import type { User } from '../types';

interface UserAvatarProps {
    user?: User;
    size?: 'sm' | 'md' | 'lg';
    isOnline?: boolean;
    showOnlineStatus?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
};

const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
};

const indicatorSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
};

export function UserAvatar({
    user,
    size = 'md',
    isOnline = false,
    showOnlineStatus = true,
    className,
}: UserAvatarProps) {
    const [imageError, setImageError] = React.useState(false);
    const initial = user?.name?.charAt(0) || user?.username?.charAt(0) || '?';

    // Reset error when user/avatar changes
    React.useEffect(() => {
        setImageError(false);
    }, [user?.avatar]);

    return (
        <div className={cn('relative inline-block', sizeClasses[size], className)}>
            <div className={cn(
                'rounded-full bg-primary/10 flex items-center justify-center overflow-hidden w-full h-full'
            )}>
                {user?.avatar && !imageError ? (
                    <img
                        src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE_URL}${user.avatar}`}
                        alt={user.name || user.username}
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className={cn('font-medium text-primary', textSizeClasses[size])}>
                        {initial}
                    </span>
                )}
            </div>
            {showOnlineStatus && isOnline && (
                <div className={cn(
                    'absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-background',
                    indicatorSizeClasses[size]
                )} />
            )}
        </div>
    );
}
