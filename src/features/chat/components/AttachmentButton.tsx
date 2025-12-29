import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface AttachmentButtonProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
}

export function AttachmentButton({ onFileSelect, disabled }: AttachmentButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.');
                return;
            }
            onFileSelect(file);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                title="Gửi ảnh/video"
            >
                <Image className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </Button>
        </>
    );
}
