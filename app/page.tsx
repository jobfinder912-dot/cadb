import Library from "@/components/library";
import { getPdfs } from "@/lib/pdfs";

export default async function Home() {
  const { documents, months } = await getPdfs();

  return <Library documents={documents} months={months} />;
}
