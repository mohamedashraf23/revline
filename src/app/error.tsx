"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="confirmation">
      <h1 className="confirmation__title">Something went wrong</h1>
      <div className="confirmation__body">
        We couldn’t load this page. If you’re running locally, check that the Python API is up on
        port 8000.
      </div>
      <button type="button" className="btn btn--sm" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
