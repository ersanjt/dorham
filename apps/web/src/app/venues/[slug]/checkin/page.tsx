import { SiteHeader } from "../../../../components/site-header";
import { PageIntro } from "../../../../components/page-intro";
import { VenueCheckInClient } from "./checkin-client";

export default async function VenueCheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="حضور" title="چک‌این مکان">
        <p className="muted">با اسکن QR صاحب مکان، حضورت تأیید می‌شود.</p>
      </PageIntro>
      <VenueCheckInClient slug={slug} />
    </main>
  );
}
