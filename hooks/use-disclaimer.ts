"use client";

import { useState, useEffect, useCallback } from "react";
import { isDisclaimerAccepted, acceptDisclaimer, revokeDisclaimer, getDisclaimerAcceptedAt } from "../lib/disclaimer";

export function useDisclaimer() {
  const [accepted, setAccepted] = useState<boolean>(false);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAccepted(isDisclaimerAccepted());
    setAcceptedAt(getDisclaimerAcceptedAt());
  }, []);

  const accept = useCallback(() => {
    acceptDisclaimer();
    setAccepted(true);
    setAcceptedAt(getDisclaimerAcceptedAt());
  }, []);

  const revoke = useCallback(() => {
    revokeDisclaimer();
    setAccepted(false);
    setAcceptedAt(null);
  }, []);

  return {
    accepted,
    acceptedAt,
    accept,
    revoke,
    isReady: mounted,
  };
}
