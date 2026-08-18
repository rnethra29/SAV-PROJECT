"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";

export function AddClientButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/sites/clients/new")}>
      <PlusIcon className="h-4 w-4" />
      Add Client
    </Button>
  );
}
