import { Smile } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const EMOJI_CATEGORIES = [
    {
        name: "Smileys",
        emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"]
    },
    {
        name: "Gestures",
        emojis: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👣", "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄"]
    },
    {
        name: "Hearts",
        emojis: ["💘", "💝", "💖", "💗", "💓", "💞", "💕", "💌", "❣️", "💔", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💯", "💢", "💥", "💫", "💦", "💨", "🕳", "💣", "💬", "👁‍🗨", "🗨", "🗯", "💭", "💤"]
    }
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    disabled?: boolean;
}

export function EmojiPicker({ onSelect, disabled }: EmojiPickerProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    disabled={disabled}
                    title="Thêm emoji"
                >
                    <Smile className="h-5 w-5 text-muted-foreground hover:text-primary" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-80 p-0 shadow-xl border-muted mb-2">
                <div className="p-3 border-b bg-muted/30">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emoji</h3>
                </div>
                <ScrollArea className="h-64 p-2">
                    {EMOJI_CATEGORIES.map((category) => (
                        <div key={category.name} className="mb-4">
                            <p className="text-[10px] font-medium text-muted-foreground mb-1 px-1">{category.name}</p>
                            <div className="grid grid-cols-8 gap-1">
                                {category.emojis.map((emoji) => (
                                    <DropdownMenuItem
                                        key={emoji}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            onSelect(emoji);
                                        }}
                                        className="h-9 w-9 p-0 flex items-center justify-center text-2xl hover:bg-primary/10 rounded cursor-pointer transition-colors focus:bg-primary/10"
                                    >
                                        {emoji}
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
