import { 
    Gamepad2, Tv, Globe, Users, Music, Palette, PenTool, 
    Code, Atom, Cpu, GraduationCap, Coffee, Swords, Bitcoin, 
    Video, Box, LucideIcon 
} from "lucide-react";

interface CategoryIconProps {
    name: string;
    className?: string;
}

const iconMap: Record<string, LucideIcon> = {
    Gamepad2,
    Tv,
    Globe,
    Users,
    Music,
    Palette,
    PenTool,
    Code,
    Atom,
    Cpu,
    GraduationCap,
    Coffee,
    Swords,
    Bitcoin,
    Video,
    Box,
};

export function CategoryIcon({ name, className = "w-4 h-4" }: CategoryIconProps) {
    const IconComponent = iconMap[name] || Box;
    return <IconComponent className={className} />;
}
