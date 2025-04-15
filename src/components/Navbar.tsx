import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import Notifications from "./Notifications"

const Navbar = () => {
  const { user, profile, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="flex h-16 items-center px-4">
        <div className="container max-w-screen-2xl">
          <div className="flex justify-between items-center">
            <Link to="/" className="font-bold text-xl">Tantsaha</Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Notifications />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.photo_profil || ""} alt={profile?.nom} />
                        <AvatarFallback>{profile?.nom?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>Mon profil</SheetTitle>
                      <SheetDescription>
                        Faites des modifications à votre profil ici. Cliquez sur enregistrer lorsque vous avez terminé.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="name" className="text-right text-sm font-medium leading-none text-right">
                          Nom
                        </label>
                        <div className="col-span-3">
                          <input
                            type="text"
                            id="name"
                            placeholder="Nom"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="username" className="text-right text-sm font-medium leading-none text-right">
                          Prénom
                        </label>
                        <div className="col-span-3">
                          <input
                            type="text"
                            id="username"
                            placeholder="Prénom"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                    <Button>Enregistrer</Button>
                  </SheetContent>
                </Sheet>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.photo_profil || ""} alt={profile?.nom} />
                        <AvatarFallback>{profile?.nom?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.nom} {profile?.prenoms}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div>
                <Link to="/auth">Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default Navbar;
