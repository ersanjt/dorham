"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authHref } from "./paths";

export function useAuthHrefs() {
  const pathname = usePathname() || "/";
  const [hrefs, setHrefs] = useState({ login: "/login", register: "/register" });

  useEffect(() => {
    const search = window.location.search;
    setHrefs({
      login: authHref("/login", pathname, search),
      register: authHref("/register", pathname, search),
    });
  }, [pathname]);

  return hrefs;
}
