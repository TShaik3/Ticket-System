import Container from "@/components/Container";

export default function Layout({ children }: LayoutProps<"/orders">) {
  return <Container>{children}</Container>;
}
