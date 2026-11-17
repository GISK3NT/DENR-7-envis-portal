import type { GeometryType } from "@/lib/types";

const shapes: Record<GeometryType, React.ReactNode> = {
  polygon: <path d="M2 5.5 6 2l6 1.5 2 6-4 4.5-7-1L2 5.5Z" />,
  polyline: <path d="M2 12.5 6.5 6l4 4L16 2.5" />,
  point: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M9 12.5v3.5" />
    </>
  ),
};

export default function GeometryIcon({ type, className = "h-4 w-4" }: { type: GeometryType; className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {shapes[type]}
    </svg>
  );
}
