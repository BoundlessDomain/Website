"use client";

import { useEffect } from "react";

export default function DevTitleHandler() {
    useEffect(() => {
        const updateTitle = () => {
            const hostname = window.location.hostname;
            const isDev = hostname.includes("dev.");
            // If we are on dev, ensure title starts with {Dev}
            if (isDev && !document.title.startsWith("{Dev} ")) {
                document.title = `{Dev} ${document.title}`;
            }
        };

        // Initial check
        updateTitle();

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(() => {
            updateTitle();
        });

        // Start observing the head for changes (including title replacements)
        const headElement = document.querySelector("head");
        if (headElement) {
            observer.observe(headElement, { childList: true, subtree: true });
        }

        // Also observe document.title changes directly if possible via head changes
        // But usually observing the title tag text content is enough for React Helmet/Next Head

        return () => {
            observer.disconnect();
        };
    }, []);

    return null; // This component renders nothing visual
}
