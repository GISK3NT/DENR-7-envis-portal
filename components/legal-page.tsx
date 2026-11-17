type Section = { title: string; body: string };

export default function LegalPage({
  kicker,
  title,
  lead,
  sections,
  note,
}: {
  kicker?: string;
  title: string;
  lead: string;
  sections: Section[];
  note?: string;
}) {
  return (
    <div className="container-gov py-12">
      <div className="max-w-3xl">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h1 className="mt-2 text-3xl font-bold text-forest-950 sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-forest-900/80">{lead}</p>

        <div className="doc mt-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2>
                <span className="mr-2 font-mono text-sm text-forest-400">{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        {note ? (
          <p className="mt-10 rounded-[10px] border border-brass-200 bg-brass-50 px-4 py-3 text-sm text-brass-700">{note}</p>
        ) : null}
      </div>
    </div>
  );
}
