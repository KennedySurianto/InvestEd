import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"

// A helper function to generate avatar fallbacks from a name
const getInitials = (name: string = "") => {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
}

export default function AppHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <header className="w-full border-b border-border/40 sticky top-0 z-30 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            {/* Left Side: Logo */}
            <Link to="/home" className="font-bold tracking-tight text-xl">
            <span className="text-primary">Invest</span>Ed
            </Link>

            {/* Middle: Authenticated Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                Courses
            </Link>
            <Link to="/news-category" className="text-muted-foreground hover:text-primary transition-colors">
                News
            </Link>
            <Link to="/research" className="text-muted-foreground hover:text-primary transition-colors">
                Researches
            </Link>
            <Link to="/forum" className="text-muted-foreground hover:text-primary transition-colors">
                Forum
            </Link>
            </nav>

            {/* Right Side: Profile Dropdown */}
            <div className="flex items-center gap-4">
            {user && (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="" alt={`@${user.full_name}`} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    >
                    Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            )}
            </div>
        </div>
        </header>
    )
}