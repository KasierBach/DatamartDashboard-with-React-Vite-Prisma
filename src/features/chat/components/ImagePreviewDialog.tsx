import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { X, Download, ZoomIn, ZoomOut, RotateCw, RotateCcw, ArrowUpDown, ArrowLeftRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ImagePreviewDialogProps {
    src: string;
    open: boolean;
    onClose: () => void;
}

export function ImagePreviewDialog({ src, open, onClose }: ImagePreviewDialogProps) {
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Reset state when dialog opens/closes or src changes
    useEffect(() => {
        if (open) {
            handleReset();
        }
    }, [open, src]);

    const handleReset = () => {
        setScale(1);
        setRotate(0);
        setFlipH(false);
        setFlipV(false);
        setPosition({ x: 0, y: 0 });
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = src.split('/').pop() || 'image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
    const handleRotateCw = () => setRotate(prev => prev + 90);
    const handleRotateCcw = () => setRotate(prev => prev - 90);
    const handleFlipH = () => setFlipH(prev => !prev);
    const handleFlipV = () => setFlipV(prev => !prev);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

    const transformStyle = {
        transform: `scale(${scale}) rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-in-out'
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-[95vw] p-0 overflow-hidden bg-black/95 border-none shadow-2xl flex flex-col h-[90vh]">
                <DialogTitle className="sr-only">Xem ảnh chi tiết</DialogTitle>

                {/* Top Bar */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={handleDownload}
                        title="Tải xuống"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={onClose}
                        title="Đóng"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Main Image Area */}
                <div
                    className={cn(
                        "relative flex-1 w-full overflow-hidden flex items-center justify-center bg-black/50 select-none",
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <div
                        style={{ transform: `translate(${position.x}px, ${position.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s' }}
                        className="flex items-center justify-center w-full h-full"
                    >
                        <img
                            src={src}
                            alt="Preview"
                            draggable={false}
                            style={transformStyle}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                </div>

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-center gap-1 p-3 bg-black/80 backdrop-blur-sm border-t border-white/10 z-50">
                    <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Thu nhỏ" className="text-white/70 hover:text-white hover:bg-white/10" disabled={scale <= 0.5}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white/50 text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Phóng to" className="text-white/70 hover:text-white hover:bg-white/10" disabled={scale >= 5}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-white/20 mx-2" />

                    <Button variant="ghost" size="icon" onClick={handleRotateCcw} title="Xoay trái" className="text-white/70 hover:text-white hover:bg-white/10">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleRotateCw} title="Xoay phải" className="text-white/70 hover:text-white hover:bg-white/10">
                        <RotateCw className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-white/20 mx-2" />

                    <Button variant="ghost" size="icon" onClick={handleFlipH} title="Lật ngang" className={cn("text-white/70 hover:text-white hover:bg-white/10", flipH && "bg-white/10 text-white")}>
                        <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleFlipV} title="Lật dọc" className={cn("text-white/70 hover:text-white hover:bg-white/10", flipV && "bg-white/10 text-white")}>
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-white/20 mx-2" />

                    <Button variant="ghost" size="icon" onClick={handleReset} title="Đặt lại" className="text-white/70 hover:text-white hover:bg-white/10">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
