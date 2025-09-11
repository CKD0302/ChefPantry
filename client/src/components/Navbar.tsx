import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useAuth } from "@/hooks/useAuth";
import { UtensilsIcon } from "@/lib/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";

export default function Navbar() {
  const { isOpen, toggle } = useMobileMenu();
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [isHome, setIsHome] = useState(window.location.pathname === "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isOpen) toggle();
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <span className="text-primary font-poppins font-bold text-2xl">Chef Pantry</span>
                <UtensilsIcon className="ml-2 text-primary h-5 w-5" />
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {isHome ? (
              <>
                <a href="#how-it-works" className="text-neutral-800 hover:text-primary font-medium">
                  How It Works
                </a>
                <a href="#for-chefs" className="text-neutral-800 hover:text-primary font-medium">
                  For Chefs
                </a>
                <a href="#for-businesses" className="text-neutral-800 hover:text-primary font-medium">
                  For Businesses
                </a>
                <a href="#contact" className="text-neutral-800 hover:text-primary font-medium">
                  Contact
                </a>
              </>
            ) : (
              <Link href="/" className="text-neutral-800 hover:text-primary font-medium">
                Home
              </Link>
            )}
            
            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                <NotificationsBell userId={user.id} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="space-x-2 border-primary text-primary">
                      <User className="h-4 w-4" />
                      <span>Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile/view")}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile/notification-settings")}>
                      Notification Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  className="border-primary text-primary"
                  onClick={() => navigate("/auth/signin")}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary-dark text-white"
                  onClick={() => navigate("/auth/signup")}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle menu">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Auth Buttons - Always at the top for authenticated users */}
            {user ? (
              <>
                {/* Dashboard and Profile always first */}
                <a 
                  className="block px-3 py-2 text-neutral-800 hover:text-primary font-bold"
                  onClick={() => handleNavigation("/dashboard")}
                >
                  Dashboard
                </a>
                <a 
                  className="block px-3 py-2 text-neutral-800 hover:text-primary font-bold"
                  onClick={() => handleNavigation("/profile/view")}
                >
                  Profile
                </a>

                {/* Separator */}
                <div className="border-t my-2"></div>
                
                {/* Other navigation links */}
                {isHome ? (
                  <>
                    <a 
                      href="#how-it-works" 
                      className="block px-3 py-2 text-neutral-800 hover:text-primary font-medium"
                      onClick={toggle}
                    >
                      How It Works
                    </a>
                    <a 
                      href="#for-chefs" 
                      className="block px-3 py-2 text-neutral-800 hover:text-primary font-medium"
                      onClick={toggle}
                    >
                      For Chefs
                    </a>
                    <a 
                      href="#for-businesses" 
                      className="block px-3 py-2 text-neutral-800 hover:text-primary font-medium"
                      onClick={toggle}
                    >
                      For Businesses
                    </a>
                    <a 
                      href="#contact" 
                      className="block px-3 py-2 text-neutral-800 hover:text-primary font-medium"
                      onClick={toggle}
                    >
                      Contact
                    </a>
                  </>
                ) : (
                  <a 
                    className="block px-3 py-2 text-neutral-800 hover:text-primary font-medium"
                    onClick={() => handleNavigation("/")}
                  >
                    Home
                  </a>
                )}
                
                {/* Sign Out at the bottom */}
                <div className="border-t my-2"></div>
                <a 
                  className="block px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                  onClick={handleSignOut}
                >
                  Sign Out
                </a>
              </>
            ) : (
              <>
                <Button 
                  className="block w-full my-2 text-primary border border-primary"
                  variant="outline"
                  onClick={() => handleNavigation("/auth/signin")}
                >
                  Sign In
                </Button>
                <Button 
                  className="block w-full bg-primary hover:bg-primary-dark text-white"
                  onClick={() => handleNavigation("/auth/signup")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
