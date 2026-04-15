import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg hero-gradient-bg flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">A</span>
            </div>
            <span className="font-heading font-bold text-lg">Abancool</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Enterprise-grade POS solutions for every business type. Built for Africa, scaled for the world.
          </p>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Solutions</h4>
          <div className="space-y-2">
            <Link to="/solutions" className="block text-sm text-muted-foreground hover:text-foreground">Retail POS</Link>
            <Link to="/solutions" className="block text-sm text-muted-foreground hover:text-foreground">Bar & Liquor POS</Link>
            <Link to="/solutions" className="block text-sm text-muted-foreground hover:text-foreground">Restaurant POS</Link>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Company</h4>
          <div className="space-y-2">
            <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground">About Us</Link>
            <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground">Contact</Link>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Get Started</h4>
          <div className="space-y-2">
            <Link to="/register" className="block text-sm text-muted-foreground hover:text-foreground">Create Account</Link>
            <Link to="/login" className="block text-sm text-muted-foreground hover:text-foreground">Sign In</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border mt-8 pt-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Abancool Technology. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
