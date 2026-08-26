export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  // We don't render html/body here because Next.js App Router already provides it in the root layout.
  // We just wrap it in a container that fills the screen.
  return (
    <div className="bg-transparent m-0 p-0 font-sans h-screen w-screen overflow-hidden">
      {children}
    </div>
  );
}
