import GeohazardMapsBrowser from "@/components/geohazard-maps-browser";

export const metadata = {
  title: "MGB Geohazard Maps (JPEG) · ENVIS",
  description: "Region VII MGB geohazard susceptibility and contour map images (JPEG) by province and municipality.",
};

export default function GeohazardsMapsPage() {
  return (
    <div className="container-gov py-10">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-600">Maps & Resources</p>
        <h1 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.05] tracking-tightest text-forest-950">
          Region VII MGB Geohazard Maps
        </h1>
        <p className="mt-4 max-w-[70ch] text-[14.5px] leading-7 text-forest-800/85">
          Municipal geohazard susceptibility maps (HS) and contour maps (CTOUR) from MGB/DENR Region VII, provided as
          reference JPEG map sheets (Bohol and Cebu). Select a province and map type to browse and view.
        </p>
        <p className="mt-2 text-xs text-forest-600">
          Source: <span className="font-medium">shapefiles/Region VII R7 MGB GEOHAZARDS Jpeg</span> (reference images for viewing).
        </p>
      </div>
      <div className="mt-8">
        <GeohazardMapsBrowser />
      </div>
    </div>
  );
}
