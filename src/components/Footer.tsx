import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg hero-gradient-bg flex items-center justify-center glow-sm">
              <span className="text-primary-foreground font-heading font-bold text-sm">A</span>
            </div>
            <span className="font-heading font-bold text-lg">Abancool Technology</span>
          </div>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Reliable POS systems for retail, bars and restaurants — built for Africa, scaled for the world.
          </p>
          <div className="space-y-2">
            <a href="mailto:info@abancool.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Mail size={14} className="text-primary" /> info@abancool.com
            </a>
            <a href="tel:+254111679286" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Phone size={14} className="text-primary" /> 0111 679 286 / 0728 825 152
            </a>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} className="text-primary" /> Garissa & Kerugoya, Kenya
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Solutions</h4>
          <div className="space-y-2">
            <Link to="/solutions" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Retail POS</Link>
            <Link to="/solutions" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Bar & Liquor POS</Link>
            <Link to="/solutions" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Restaurant POS</Link>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Company</h4>
          <div className="space-y-2">
            <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link>
            <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Get Started</h4>
          <div className="space-y-2">
            <Link to="/register" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Create Account</Link>
            <Link to="/login" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Sign In</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()} Abancool Technology. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground font-body">
          Built for businesses that demand uptime.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
