import TrackingClient from './tracking-client';

export const dynamic = 'force-dynamic';

export default function TrackingPage({ params }: { params: { id: string } }) {
  return <TrackingClient orderId={params?.id ?? ''} />;
}
