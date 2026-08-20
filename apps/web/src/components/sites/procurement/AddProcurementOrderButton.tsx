"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";

export function AddProcurementOrderButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/sites/procurement/new")}>
      <PlusIcon className="h-4 w-4" />
      Add Purchase Order
    </Button>
  );
}
