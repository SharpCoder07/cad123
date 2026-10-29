import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main
      className="loading-page min-h-[65vh]"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      <div className="mx-auto flex min-h-[65vh] max-w-7xl items-center justify-center px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="loading-page-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
            <LoaderCircle
              size={24}
              className="loading-page-spinner animate-spin"
            />
          </div>

          <h2
            className="mt-5 text-lg font-bold"
            style={{ color: "var(--site-text)" }}
          >
            Loading...
          </h2>

          <p
            className="mt-2 text-sm"
            style={{ color: "var(--site-muted)" }}
          >
            Getting everything ready for you.
          </p>
        </div>
      </div>
    </main>
  );
}