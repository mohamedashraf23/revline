import Link from "next/link";

/**
 * Pagination as real links — crawlable, middle-clickable, and rendered on the
 * server with the rest of the listing.
 *
 * Deliberately NOT a client component: it takes `makeHref` from the shop page,
 * and a function cannot cross the server/client boundary. SortSelect needs
 * hooks and so lives in ShopControls.tsx instead.
 */
export function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) return null;

  // A sliding window, always including the first and last page.
  const window = new Set<number>([1, pages, page]);
  for (let offset = 1; offset <= 2; offset += 1) {
    if (page - offset >= 1) window.add(page - offset);
    if (page + offset <= pages) window.add(page + offset);
  }
  const shown = [...window].sort((a, b) => a - b);

  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className="pager__step" rel="prev">
          ← Prev
        </Link>
      ) : (
        <span className="pager__step pager__step--off">← Prev</span>
      )}

      <ol className="pager__list">
        {shown.map((n, index) => (
          <li key={n}>
            {index > 0 && n - shown[index - 1] > 1 && <span className="pager__gap">…</span>}
            {n === page ? (
              <span className="pager__page pager__page--current" aria-current="page">
                {n}
              </span>
            ) : (
              <Link href={makeHref(n)} className="pager__page">
                {n}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {page < pages ? (
        <Link href={makeHref(page + 1)} className="pager__step" rel="next">
          Next →
        </Link>
      ) : (
        <span className="pager__step pager__step--off">Next →</span>
      )}
    </nav>
  );
}
