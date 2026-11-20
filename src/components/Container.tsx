/** Content width for inner pages (events, tickets, login, admin). The landing page uses full-width sections. */
export default function Container({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-5 py-10 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</div>;
}
