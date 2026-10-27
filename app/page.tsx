import MapExplorer from "@/components/MapExplorer";
import { getCases, getZones } from "@/lib/data";

export const revalidate = 300;

export default async function Home() {
  const [zones, cases] = await Promise.all([getZones(), getCases()]);
  return <MapExplorer zones={zones} cases={cases} />;
}
