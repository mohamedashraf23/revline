"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { ShoppingCartIcon } from "./icons";
import { RevlineMark } from "./Logo";
import { SearchBox } from "./SearchBox";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { cart, garage, selectGarageVehicle } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const vehicle = cart?.vehicle ?? null;
  const count = cart?.item_count ?? 0;

  // Close the account/garage menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const navClass = (active: boolean) => `nav__link${active ? " nav__link--active" : ""}`;

  async function switchVehicle(id: number) {
    await selectGarageVehicle(id);
    setMenuOpen(false);
    router.refresh();
  }

  return (
    <header className="header">
      <div className="header__left">
        <Link href="/" className="brand" aria-label="Revline home">
          <RevlineMark size={34} />
          <div className="brand__word">REVLINE</div>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/" className={navClass(pathname === "/")}>
            Home
          </Link>
          <Link href="/shop" className={navClass(pathname.startsWith("/shop"))}>
            Shop
          </Link>
          <Link href="/shop?badge=Sale" className={navClass(false)}>
            Deals
          </Link>
          <Link href="/account" className={navClass(pathname.startsWith("/account"))}>
            Garage
          </Link>
        </nav>
      </div>

      <SearchBox />

      <div className="header__right">
        {vehicle && (
          <div className="vehicle-menu" ref={menuRef}>
            <button
              type="button"
              className="vehicle-chip"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span aria-hidden>🚗</span> {vehicle.label}
              <span aria-hidden className="vehicle-chip__caret">
                ▾
              </span>
            </button>

            {menuOpen && (
              <div className="vehicle-menu__pop" role="menu">
                {garage.length > 1 && <div className="vehicle-menu__head">Switch vehicle</div>}
                {garage
                  .filter((v) => v.id !== vehicle.id)
                  .map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      role="menuitem"
                      className="vehicle-menu__item"
                      onClick={() => switchVehicle(v.id)}
                    >
                      {v.label}
                    </button>
                  ))}
                <Link
                  href="/account"
                  role="menuitem"
                  className="vehicle-menu__item vehicle-menu__item--link"
                  onClick={() => setMenuOpen(false)}
                >
                  Manage garage →
                </Link>
              </div>
            )}
          </div>
        )}

        {user ? (
          <div className="account-links">
            <Link href="/account" className="signin">
              {user.full_name.split(" ")[0]}
            </Link>
            <button type="button" className="signout" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/signin" className="signin">
            Sign In
          </Link>
        )}

        <Link href="/cart" className="cart-button" aria-label={`Cart, ${count} items`}>
          <ShoppingCartIcon size={24} />
          {count > 0 && <span className="cart-button__count">{count}</span>}
        </Link>
      </div>
    </header>
  );
}
