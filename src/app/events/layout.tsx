import Container from "@/components/Container";

export default function Layout({ children }: LayoutProps<"/events">) {
  return <Container>{children}</Container>;
}
