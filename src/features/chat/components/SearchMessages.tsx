import { useState, useCallback } from 'react';
import { Search, X, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { API_ENDPOINTS } from '@/config/api';
import type { Message } from '../types';

interface SearchMessagesProps {
    conversationId: number;
    userId: number | null;
    onResultClick: (messageId: number) => void;
    onClose: () => void;
}

export function SearchMessages({
    conversationId,
    userId,
    onResultClick,
    onClose
}: SearchMessagesProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Message[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!query.trim() || !userId) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}&userId=${userId}`
            );
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, [query, conversationId, userId]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="absolute inset-0 bg-background z-20 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tìm kiếm tin nhắn..."
                        className="pl-9 pr-9"
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setResults([]); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Results */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {isSearching ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Đang tìm kiếm...
                        </p>
                    ) : results.length > 0 ? (
                        results.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => onResultClick(msg.id)}
                                className="p-3 rounded-lg hover:bg-muted cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                            {msg.sender?.name} • {new Date(msg.created_at).toLocaleDateString('vi-VN')}
                                        </p>
                                        <p className="text-sm truncate">{msg.content}</p>
                                    </div>
                                    <ArrowDown className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))
                    ) : query ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Không tìm thấy kết quả nào
                        </p>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Nhập từ khóa để tìm kiếm tin nhắn
                        </p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
