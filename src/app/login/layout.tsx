import Container from "@/components/Container";

export default function Layout({ children }: LayoutProps<"/login">) {
  return <Container>{children}</Container>;
}
