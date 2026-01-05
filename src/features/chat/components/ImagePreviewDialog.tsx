import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewDialogProps {
    src: string;
    open: boolean;
    onClose: () => void;
}

export function ImagePreviewDialog({ src, open, onClose }: ImagePreviewDialogProps) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = src.split('/').pop() || 'image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/90 border-none shadow-2xl flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">Xem ảnh chi tiết</DialogTitle>

                <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={handleDownload}
                        title="Tải xuống"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={onClose}
                        title="Đóng"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
                    <img
                        src={src}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain transition-transform duration-300"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
