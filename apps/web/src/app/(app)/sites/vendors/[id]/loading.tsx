import { Skeleton } from "@/components/ui/Skeleton";

export default function VendorDetailLoading() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1200px]">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
