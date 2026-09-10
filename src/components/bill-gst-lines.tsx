import { getGstDisplayLines, type BillTotals } from "@/lib/receipt";

const DEFAULT_SEPARATOR =
  "my-1.5 block h-0 w-full border-0 border-t border-dashed border-cafe-300";

type Props = {
  bill: BillTotals;
  formatAmount: (amount: number) => string;
  lineClassName?: string;
  totalClassName?: string;
  /** Line after subtotal and after the combined GST amount */
  separatorClassName?: string;
  showSeparators?: boolean;
};

/** CGST, SGST, then combined GST, with separators after subtotal and after GST. */
export default function BillGstLines({
  bill,
  formatAmount,
  lineClassName = "mt-0.5 flex justify-between gap-3",
  totalClassName,
  separatorClassName = DEFAULT_SEPARATOR,
  showSeparators = true,
}: Props) {
  const lines = getGstDisplayLines(bill);
  if (!lines.length) return null;

  return (
    <>
      {showSeparators ? <hr className={separatorClassName} /> : null}
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
      {showSeparators ? <hr className={separatorClassName} /> : null}
    </>
  );
}
