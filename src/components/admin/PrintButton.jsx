"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <button type="button" onClick={() => window.print()} className="admin-btn-primary">
            <Printer size={16} /> Print
        </button>
    );
}
