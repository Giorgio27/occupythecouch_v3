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
          className="w-full appearance-none px-4 py-3 rounded-xl border border-border bg-card text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            hover:border-primary/50 hover:bg-secondary/50
            transition-all duration-200 cursor-pointer text-sm sm:text-base font-medium pr-10"
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
