import { useState, useRef, useCallback } from 'react';
import { Mic, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { API_ENDPOINTS } from '@/config/api';

interface VoiceRecorderProps {
    onRecordComplete: (voiceUrl: string, duration: number) => void;
    onCancel: () => void;
    disabled?: boolean;
}

export function VoiceRecorder({ onRecordComplete, onCancel, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());

                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                    // Upload blob
                    setIsUploading(true);
                    try {
                        const formData = new FormData();
                        formData.append('file', audioBlob, `voice_${Date.now()}.webm`);

                        const response = await fetch(API_ENDPOINTS.UPLOAD, {
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            const { url } = await response.json();
                            onRecordComplete(url, recordingTime);
                        }
                    } catch (error) {
                        console.error('Upload failed:', error);
                    } finally {
                        setIsUploading(false);
                    }
                }

                setRecordingTime(0);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền.');
        }
    }, [recordingTime, onRecordComplete]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingTime(0);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        onCancel();
    }, [isRecording, onCancel]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isRecording || isUploading) {
        return (
            <div className="flex items-center gap-2 w-full p-2 bg-destructive/10 rounded-lg">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelRecording}
                    className="text-destructive hover:text-destructive/80"
                    disabled={isUploading}
                >
                    <X className="h-5 w-5" />
                </Button>

                <div className="flex-1 flex items-center gap-3">
                    <div className={cn(
                        'h-3 w-3 rounded-full',
                        isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted'
                    )} />
                    <span className="text-sm font-medium">
                        {isUploading ? 'Đang gửi...' : formatTime(recordingTime)}
                    </span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-destructive transition-all"
                            style={{ width: `${Math.min(recordingTime * 2, 100)}%` }}
                        />
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={stopRecording}
                    className="text-primary"
                    disabled={isUploading}
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startRecording}
            disabled={disabled}
            title="Ghi âm tin nhắn thoại"
            className="hover:text-primary"
        >
            <Mic className="h-5 w-5" />
        </Button>
    );
}
