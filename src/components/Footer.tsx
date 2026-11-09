import Link from "next/link";

import { RevlineLogo } from "./Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <RevlineLogo size={26} tone="mono" className="footer__brand" />
        <div>© {new Date().getFullYear()} Revline Auto Parts</div>
      </div>
      <div className="footer__links">
        <Link href="/shop">Shipping</Link>
        <Link href="/shop">Returns</Link>
        <Link href="/shop">Contact</Link>
      </div>
    </footer>
  );
}
