export default function ThumbLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden", background: "#0b0f0c" }}>{children}</body>
    </html>
  );
}
