import Link from "next/link";

/**
 * Facets are links rather than buttons so filter state lives in the URL — shareable,
 * back-button friendly, and re-rendered on the server.
 */
export function FacetLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`facet__option${active ? " facet__option--active" : ""}`}
      aria-current={active ? "true" : undefined}
    >
      {label}
    </Link>
  );
}
