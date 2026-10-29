import SectionRenderer from "@/lib/website-builder/SectionRenderer";
import type { PublishedWebsitePage } from "@/lib/website-builder/public-pages";

type PageRendererProps = {
  page: PublishedWebsitePage;
  className?: string;
};

/**
 * Displays a previously loaded, published CMS page.
 * Fetch and authorize publication state on the server with
 * getPublishedWebsitePage() before passing the result here.
 *
 * This component intentionally does not render arbitrary HTML, CSS,
 * scripts, or version settings. The section and element renderers
 * apply their own constrained rendering rules.
 */
export default function PageRenderer({ page, className }: PageRendererProps) {
  return (
    <SectionRenderer
      sections={page.sections}
      className={className}
    />
  );
}
