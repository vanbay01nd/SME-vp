"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEFAULT_PRIVACY_CONFIG, PrivacyConfig, maskField } from "../lib/privacy";

const PRIVACY_CONFIG_KEY = "sme-privacy-config";
const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

export function usePrivacy() {
  const [config, setConfig] = useState<PrivacyConfig>(DEFAULT_PRIVACY_CONFIG);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Load from local storage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(PRIVACY_CONFIG_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.level && parsed.fields) {
          setConfig(parsed);
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }, []);

  // Save to local storage
  const saveConfig = useCallback((newConfig: PrivacyConfig) => {
    setConfig(newConfig);
    localStorage.setItem(PRIVACY_CONFIG_KEY, JSON.stringify(newConfig));
  }, []);

  // Auto-lock functionality
  const activateFullPrivacy = useCallback(() => {
    setConfig((prev) => {
      const next = { ...prev, level: "full" as const };
      localStorage.setItem(PRIVACY_CONFIG_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const resetTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(activateFullPrivacy, AUTO_LOCK_MS);
    };

    resetTimer();

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer, { passive: true });

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [mounted, activateFullPrivacy]);

  const togglePrivacy = useCallback(() => {
    saveConfig({
      ...config,
      level: config.level === "off" ? "full" : "off",
    });
  }, [config, saveConfig]);

  const mask = useCallback(
    (value: string | undefined | null, fieldType: keyof PrivacyConfig["fields"]) => {
      if (!value) return "";
      return maskField(value, fieldType, config);
    },
    [config]
  );

  return {
    config,
    saveConfig,
    togglePrivacy,
    mask,
    isMasked: config.level !== "off",
    isReady: mounted,
  };
}
