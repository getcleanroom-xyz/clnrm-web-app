/**
 * Render a JSON-LD script. Server component only — pass plain, serializable
 * data (no functions, no Dates). Always keep schema fields in sync with the
 * visible content on the same page ("content parity").
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}