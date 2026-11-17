import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import LegalPage from "@/components/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${getDictionary(locale).privacy.title} · ENVIS` };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const p = t.privacy;

  return (
    <LegalPage
      kicker="ENVIS"
      title={p.title}
      lead={p.lead}
      sections={[
        { title: p.s1_title, body: p.s1_body },
        { title: p.s2_title, body: p.s2_body },
        { title: p.s3_title, body: p.s3_body },
        { title: p.s4_title, body: p.s4_body },
        { title: p.s5_title, body: p.s5_body },
      ]}
    />
  );
}
