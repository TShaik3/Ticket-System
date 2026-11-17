"use client";
export default function PrintButton({ label = "Print" }: { label?: string }) {
  return <button className="btn btn-ghost no-print" onClick={() => window.print()}>{label}</button>;
}
