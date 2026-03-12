"use client";

import { ChevronDown, BarChart3 } from "lucide-react";
import type { Supplier } from "@/lib/shared/types";

type SupplierSelectProps = {
  suppliers: Supplier[];
  selectedSupplier: Supplier;
  onSupplierChange: (supplier: Supplier) => void;
};

export default function SupplierSelect({
  suppliers,
  selectedSupplier,
  onSupplierChange,
}: SupplierSelectProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <label
        htmlFor="supplier"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3"
      >
        <BarChart3 className="w-4 h-4 text-primary" />
        Ordina per
      </label>

      <div className="relative w-full sm:w-72">
        <select
          id="supplier"
          value={selectedSupplier.id}
          onChange={(e) => {
            const supplier = suppliers.find((s) => s.id === e.target.value);
            if (supplier) onSupplierChange(supplier);
          }}
          className="w-full appearance-none cine-input pr-10 cursor-pointer text-sm sm:text-base font-medium"
        >
          {suppliers.map((supplier) => (
            <option
              key={supplier.id}
              value={supplier.id}
              className="bg-card text-foreground"
            >
              {supplier.name}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
