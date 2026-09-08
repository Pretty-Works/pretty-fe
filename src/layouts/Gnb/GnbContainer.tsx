"use client";

import { useHydrated } from "@/hooks/useHydrated";

import { useLogoutMutation } from "@/features/auth/login/hooks/mutations/useLogoutMutation";
import { useProjectsQuery } from "@/features/project/hooks/queries/useProjectsQuery";
import { useLastProjectStore } from "@/features/project/stores/useLastProjectStore";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import GnbView from "@/layouts/Gnb/Gnb";

export default function GnbContainer() {
  const hydrated = useHydrated();
  const lastProjectId = useLastProjectStore((state) => state.projectId);
  const needsFallback = hydrated && !lastProjectId;
  const { data: fallback } = useProjectsQuery(
    { status: "ONGOING", page: 0, size: 1 },
    needsFallback,
  );
  const { data: profile } = useMyProfileQuery();
  const { mutate: logout } = useLogoutMutation();

  const targetProjectId =
    (hydrated ? lastProjectId : null) ??
    (needsFallback ? fallback?.projects[0]?.id : null);

  return (
    <GnbView
      profile={profile}
      targetProjectId={targetProjectId}
      onLogout={logout}
    />
  );
}
