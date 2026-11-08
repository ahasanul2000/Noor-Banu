"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";

export function Toast() {
    const { toast } = useStore();

    return (
        <AnimatePresence>
            {toast.visible && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="fixed top-24 right-5 z-50 bg-white border-l-4 border-rose-gold shadow-2xl p-4 rounded-r flex items-center gap-3 w-72"
                >
                    <CheckCircle className="text-rose-gold shrink-0" size={24} />
                    <div>
                        <h4 className="font-serif font-bold text-gray-800">Success</h4>
                        <p className="text-sm text-gray-500 whitespace-nowrap">{toast.message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
