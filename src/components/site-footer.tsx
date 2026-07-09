import { Link } from "@tanstack/react-router";
import { Sprout, Mail, Phone, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-xl font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-primary-foreground">
                <Sprout className="h-5 w-5" />
              </span>
              UDO Farm
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Cultivating progress, harvesting the future. Bulk farm produce
              powered by Pi Network.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">
              Company
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About us</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact us</Link></li>
              <li><Link to="/marketplace" className="text-muted-foreground hover:text-foreground">Marketplace</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">
              Support
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="h-4 w-4" /> Customer service 24/7</li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms of service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">
              Reach us
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@udofarm.app</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +234 800 UDO FARM</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} UDO Farm. All rights reserved.</p>
          <p>Built on Pi Network.</p>
        </div>
      </div>
    </footer>
  );
}
