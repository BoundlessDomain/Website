"use client";

import { useEffect } from "react";

export default function DevTitleHandler() {
    useEffect(() => {
        // Change title based on domain
        if (window.location.hostname.includes("dev.")) {
            document.title = "{Dev} Bobby's Site";
        } else if (window.location.hostname === "bobbyyu.me" || window.location.hostname === "www.bobbyyu.me") {
            document.title = "Bobby's Site";
        }
    }, []);

    return null; // This component renders nothing visual
}
