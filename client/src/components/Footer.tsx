import { UtensilsIcon } from "@/lib/icons";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    forChefs: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Sign Up", href: "#" },
      { label: "Find Jobs", href: "#" },
      { label: "Success Stories", href: "#" }
    ],
    forBusinesses: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Register", href: "#" },
      { label: "Find Chefs", href: "#" },
      { label: "Testimonials", href: "#" }
    ],
    company: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#contact" }
    ]
  };
  
  const socialLinks = [
    { icon: <Facebook className="h-4 w-4" />, href: "#" },
    { icon: <Twitter className="h-4 w-4" />, href: "#" },
    { icon: <Instagram className="h-4 w-4" />, href: "#" },
    { icon: <Linkedin className="h-4 w-4" />, href: "#" }
  ];
  
  const legalLinks = [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookies", href: "#" }
  ];
  
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-primary font-poppins font-bold text-2xl">Chef Pantry</span>
              <UtensilsIcon className="ml-2 text-primary h-5 w-5" />
            </div>
            <p className="text-neutral-300 mb-4">
              Connecting culinary talent with hospitality businesses.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  href={social.href} 
                  key={index}
                  className="text-neutral-300 hover:text-primary transition-colors"
                  aria-label={`Social media link ${index + 1}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">For Chefs</h3>
            <ul className="space-y-2">
              {footerLinks.forChefs.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-neutral-300 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">For Businesses</h3>
            <ul className="space-y-2">
              {footerLinks.forBusinesses.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-neutral-300 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-neutral-300 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400">© {currentYear} Chef Pantry. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {legalLinks.map((link, index) => (
              <a 
                href={link.href} 
                key={index}
                className="text-neutral-400 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
