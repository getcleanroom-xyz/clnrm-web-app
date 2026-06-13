import { ErrorBoundary } from "@/components/error-boundary";
import { StreamPlayer } from "@/components/stream-player";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ErrorBoundary>
      <StreamPlayer sessionId={id} />
    </ErrorBoundary>
  );
}
