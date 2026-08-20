import { Skeleton } from "@/components/ui/Skeleton";

export default function NewVendorInvoiceLoading() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1100px]">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
