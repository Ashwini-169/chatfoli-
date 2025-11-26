import { cx } from "lib/cx";

type TableProps = {
  table: React.ReactNode[][];
  title?: string;
  className?: string;
  trClassNames?: string[];
  tdClassNames?: string[];
};

export const Table = ({
  table,
  title,
  className = "",
  trClassNames = [],
  tdClassNames = [],
}: TableProps) => {
  const tableHeader = table[0] ?? [];
  const tableBody = table.slice(1);

  return (
    <table className={cx("min-w-full divide-y divide-gray-200 text-sm text-primary-fg", className)}>
      <thead className="divide-y bg-card text-left align-top">
        {title && (
          <tr className="divide-x bg-card">
            <th className="px-2 py-1.5 font-bold" scope="col" colSpan={tableHeader.length}>
              {title}
            </th>
          </tr>
        )}
        <tr className="divide-x bg-card">
          {tableHeader.map((item, idx) => (
            <th className="px-2 py-1.5 font-semibold text-secondary-fg" scope="col" key={idx}>
              {item}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-card divide-y divide-gray-200 text-left align-top">
        {tableBody.map((row, rowIdx) => (
          <tr className={cx("divide-x", trClassNames[rowIdx])} key={rowIdx}>
            {row.map((item, colIdx) => (
              <td className={cx("px-2 py-1.5", tdClassNames[colIdx])} key={colIdx}>
                {item}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
