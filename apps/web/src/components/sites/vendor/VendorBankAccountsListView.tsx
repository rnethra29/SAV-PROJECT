import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ShieldIcon } from "@/components/ui/icons";
import type { VndVendorBankAccount } from "@/types/sites/vendor-bank-account";

type VendorBankAccountsListViewProps = {
  bankAccounts: VndVendorBankAccount[];
};

/**
 * Pure list/table rendering for the Vendor Bank Accounts section. Never
 * attempts to reveal account_number/upi_id beyond what the backend already
 * sends masked (architecture doc §20) — no "show full number" action exists
 * here on purpose.
 */
export function VendorBankAccountsListView({ bankAccounts }: VendorBankAccountsListViewProps) {
  if (bankAccounts.length === 0) {
    return (
      <EmptyState
        icon={<ShieldIcon className="h-8 w-8" />}
        title="No bank accounts yet"
        description="Add a bank account to record where payments to this vendor should be routed."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">Account Holder</th>
            <th className="px-5 py-3 font-medium">Bank</th>
            <th className="px-5 py-3 font-medium">Account Number</th>
            <th className="px-5 py-3 font-medium">IFSC</th>
            <th className="px-5 py-3 font-medium">Verification</th>
          </tr>
        </thead>
        <tbody>
          {bankAccounts.map((account) => (
            <tr key={account.bank_account_id} className="border-b border-border last:border-0 hover:bg-background/60">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{account.account_holder_name}</span>
                  {account.is_primary && <StatusBadge label="Primary" tone="success" />}
                </div>
                <div className="text-text-secondary">{account.branch ?? "—"}</div>
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{account.bank_name}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{account.account_number}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{account.ifsc_code}</td>
              <td className="px-5 py-3">
                <StatusBadge
                  label={account.is_verified ? "Verified" : "Unverified"}
                  tone={account.is_verified ? "success" : "warning"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
