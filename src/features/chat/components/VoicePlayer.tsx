import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoicePlayerProps {
    src: string;
    duration?: number;
    className?: string;
}

export function VoicePlayer({ src, duration, className }: VoicePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        audio.onended = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        audio.ontimeupdate = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
                setCurrentTime(audio.currentTime);
            }
        };

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;

        audioRef.current.currentTime = percentage * audioRef.current.duration;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayDuration = audioRef.current?.duration || duration || 0;

    return (
        <div className={cn(
            'flex items-center gap-2 p-2 min-w-[180px] bg-primary/5 rounded-lg',
            className
        )}>
            <button
                onClick={togglePlay}
                className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0"
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                )}
            </button>

            <div className="flex-1 space-y-1">
                {/* Waveform (simplified as progress bar) */}
                <div
                    className="h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-primary transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(displayDuration)}</span>
                </div>
            </div>
        </div>
    );
}
