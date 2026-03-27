import UserManual from "@/components/user-manual/UserManual";
import useCookies from "@/hooks/useCookies";
import { getProfile } from "@/utils/cms/adapters/authen/authen";
import { manualsByApplication } from "@/utils/cms/adapters/website/application-manual/manual";

export default async function UserManualPage() {
  const { token, appCode, isMTokenSession } = useCookies();
  await getProfile(token, appCode);
  
  // Original manual fetching
  let manuals = await manualsByApplication();

  /* Original logic: push CBT unconditionally
  manuals.push({
    id: manuals.length + 1,
    title: "CBT Thailand",
    href: "/user-manual/cbt-thailand",
    application_code: "CBT",
    width: 140,
    height: 140,
  });
  */

  // New logic: Filter for MToken and push CBT conditionally
  if (isMTokenSession) {
    // Only show Carbon Footprint and Travel Mart manuals
    // Exclude "โครงสร้างสไลด์..." manual
    manuals = manuals.filter(m => 
      (m.application_code === "CARBON" || m.application_code === "BUSINESS") &&
      !m.title?.includes("โครงสร้างสไลด์")
    );
  } else {
    // Show original set + CBT Thailand
    manuals.push({
      id: manuals.length + 1,
      title: "CBT Thailand",
      href: "/user-manual/cbt-thailand",
      application_code: "CBT",
      width: 140,
      height: 140,
    });
  }

  return <UserManual manuals={manuals} />;
}
