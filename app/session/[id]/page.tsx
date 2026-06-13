import { StreamPlayer } from "@/components/stream-player";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StreamPlayer sessionId={id} />;
}
