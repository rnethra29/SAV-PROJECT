"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";

export function AddVendorInvoiceButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/sites/vendor-invoices/new")}>
      <PlusIcon className="h-4 w-4" />
      Add Vendor Invoice
    </Button>
  );
}
