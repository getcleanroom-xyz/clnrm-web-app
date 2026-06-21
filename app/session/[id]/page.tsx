import type { Metadata } from "next";
import SessionClient from "./session-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Session ${id.slice(0, 8)}…` };
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionClient sessionId={id} />;
}
