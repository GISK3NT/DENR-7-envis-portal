import { notFound } from "next/navigation";
import PreviewMap from "@/components/preview-map";
import { getDataset } from "@/lib/datasets";
import { datasetColorHex } from "@/lib/dataset-color";

export const dynamic = "force-dynamic";

export default async function ThumbPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dataset = getDataset(slug);
  if (!dataset || !dataset.preview) notFound();

  const color = datasetColorHex(slug);

  return (
    <div
      style={{
        width: 400,
        height: 260,
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#e7efe4",
      }}
    >
      <PreviewMap
        src={dataset.preview.file}
        geometry={dataset.geometryType}
        color={color}
        height={260}
        interactive={false}
        className="!rounded-none !border-0"
        padding={18}
        basemap="topo"
        showControls={false}
      />
    </div>
  );
}
