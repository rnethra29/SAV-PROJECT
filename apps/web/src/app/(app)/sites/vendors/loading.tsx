import { Skeleton } from "@/components/ui/Skeleton";

export default function VendorListLoading() {
  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
