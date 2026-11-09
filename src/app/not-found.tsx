import Link from "next/link";

export default function NotFound() {
  return (
    <div className="confirmation">
      <h1 className="confirmation__title">Page not found</h1>
      <div className="confirmation__body">
        That part or page isn’t in the catalog. Try browsing all parts instead.
      </div>
      <Link href="/shop" className="btn btn--sm" style={{ color: "white" }}>
        Shop All Parts
      </Link>
    </div>
  );
}
