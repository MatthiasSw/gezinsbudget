// Plain table with the exact figures behind a chart.
export type ChartTableData = {
  columns: string[]
  rows: string[][]
}

type ChartTableProps = {
  data: ChartTableData
}

export function ChartTable({ data }: ChartTableProps): React.JSX.Element {
  return (
    <details className="chartTable" open>
      <summary>Toon als tabel</summary>
      <table>
        <thead>
          <tr>
            {data.columns.map((column, index) => (
              <th key={column} className={index === 0 ? '' : 'amount'}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td key={data.columns[index]} className={index === 0 ? '' : 'amount'}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
