import { getGstDisplayLines, type BillTotals } from "@/lib/receipt";

type Props = {
  bill: BillTotals;
  formatAmount: (amount: number) => string;
  lineClassName?: string;
  totalClassName?: string;
};

/** CGST, SGST, then combined GST % and amount. */
export default function BillGstLines({
  bill,
  formatAmount,
  lineClassName = "mt-0.5 flex justify-between gap-3",
  totalClassName,
}: Props) {
  const lines = getGstDisplayLines(bill);
  if (!lines.length) return null;

  return (
    <>
      {lines.map((line) => (
        <div
          key={line.key}
          className={
            line.emphasize && totalClassName ? totalClassName : lineClassName
          }
        >
          <span>{line.label}</span>
          <span className="shrink-0 tabular-nums">{formatAmount(line.amount)}</span>
        </div>
      ))}
    </>
  );
}
