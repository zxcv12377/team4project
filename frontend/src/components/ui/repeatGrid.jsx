export default function customGrid({ cols, rows }) {
  const colsClass = `grid-cols-[repeat(${cols})]`;
  const rowsClass = `grid-rows-[repeat(${rows})]`;
  return <div className={`p-6 w-1/2 mx-auto grid ${colsClass}  ${rowsClass} border border-gray-200 bg-white`}></div>;
}
