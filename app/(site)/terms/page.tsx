import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import LegalPage from "@/components/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${getDictionary(locale).terms.title} · ENVIS` };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const terms = t.terms;

  return (
    <LegalPage
      kicker="ENVIS"
      title={terms.title}
      lead={terms.lead}
      sections={[
        { title: terms.s1_title, body: terms.s1_body },
        { title: terms.s2_title, body: terms.s2_body },
        { title: terms.s3_title, body: terms.s3_body },
        { title: terms.s4_title, body: terms.s4_body },
        { title: terms.s5_title, body: terms.s5_body },
      ]}
    />
  );
}
