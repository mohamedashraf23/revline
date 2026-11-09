// The cart page itself is a client component, so its title lives in this layout.
export const metadata = { title: "Your cart — Revline" };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
