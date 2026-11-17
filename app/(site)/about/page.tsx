import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import LegalPage from "@/components/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${getDictionary(locale).about.title} · ENVIS` };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const a = t.about;

  return (
    <LegalPage
      kicker={a.title}
      title={a.title}
      lead={a.lead}
      sections={[
        { title: a.s1_title, body: a.s1_body },
        { title: a.s2_title, body: a.s2_body },
        { title: a.s3_title, body: a.s3_body },
        { title: a.s4_title, body: a.s4_body },
        { title: a.s5_title, body: a.s5_body },
      ]}
      note={t.footer.demo_notice}
    />
  );
}
