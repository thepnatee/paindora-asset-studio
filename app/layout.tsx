import "./styles.css";

export const metadata = {
  title: "PAINDORA Asset Studio",
  description: "Template-driven card asset production studio",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
