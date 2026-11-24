import Workspace from "@/components/workspace";
import { getPdfs } from "@/lib/pdfs";

export default async function Home() {
  const { documents, months } = await getPdfs();

  return <Workspace documents={documents} months={months} />;
}
