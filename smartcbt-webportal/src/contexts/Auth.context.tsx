"use client";

import { Profile } from "@/utils/cms/adapters/authen";
import { createContext } from "react";

export type Session = { sub: string | null; user: Profile | null };

export const AuthContext = createContext<{ session: Session | null; isMTokenSession: boolean }>({
  session: null,
  isMTokenSession: false,
});
