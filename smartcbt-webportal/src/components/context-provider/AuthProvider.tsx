"use client";

import { AuthContext, Session } from "@/contexts/Auth.context";
import { useContext } from "react";

type Props = {
  session: Session | null;
  isMTokenSession?: boolean;
  children?: React.ReactNode;
};

export function useSession() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children, session, isMTokenSession = false }: Props) => {
  return <AuthContext.Provider value={{ session, isMTokenSession }}>{children}</AuthContext.Provider>;
};
