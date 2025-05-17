import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { UtensilsIcon } from "@/lib/icons";

export default function Navbar() {
  const { isOpen, toggle } = useMobileMenu();

  return (
    <nav className="bg-white shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <span className="text-primary font-poppins font-bold text-2xl">Chefy</span>
                <UtensilsIcon className="ml-2 text-primary h-5 w-5" />
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
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
            <Button className="bg-primary hover:bg-primary-dark text-white">
              Sign Up
            </Button>
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
            <Button 
              className="block w-full mt-3 bg-primary hover:bg-primary-dark text-white"
              onClick={toggle}
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
