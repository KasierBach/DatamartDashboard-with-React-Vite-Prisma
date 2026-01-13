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
            'flex items-center gap-3 p-2 min-w-[200px]',
            className
        )}>
            <button
                onClick={togglePlay}
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-inherit shrink-0 transition-colors"
            >
                {isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                ) : (
                    <Play className="h-5 w-5 ml-0.5 fill-current" />
                )}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1.5 min-h-[40px]">
                {/* Progress Bar */}
                <div
                    className="h-1.5 bg-white/30 rounded-full cursor-pointer overflow-hidden relative"
                    onClick={handleSeek}
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-white transition-all duration-150 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-[11px] font-medium opacity-80 select-none">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(displayDuration)}</span>
                </div>
            </div>
        </div>
    );
}
