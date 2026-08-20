"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";

export function AddVendorPaymentButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/sites/vendor-payments/new")}>
      <PlusIcon className="h-4 w-4" />
      Add Vendor Payment
    </Button>
  );
}
