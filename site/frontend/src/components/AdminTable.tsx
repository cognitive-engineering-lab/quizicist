import "react-data-grid/lib/styles.css";
import Generation from "@shared/generation.type";
import { useState } from "react";
import DataGrid, { SortColumn } from "react-data-grid";

type Comparator<T> = (a: T, b: T) => number;

interface BaseTypes {
  number: number;
  string: string;
}

const comparators: { [K in keyof BaseTypes]: Comparator<BaseTypes[K]> } = {
  number: (a, b) => a - b,
  string: (a, b) => a.localeCompare(b),
};

const useSortColumns = <T,>(rows: T[], def: SortColumn[] = []) => {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>(def);

  rows = [...(rows as any)].sort((ra, rb) => {
    for (const sort of sortColumns) {
      const a = ra[sort.columnKey], b = rb[sort.columnKey];

      // always sort objects towards bottom
      if (typeof a === "object" && typeof b === "object") {
        return 0;
      } else if (typeof a === "object") {
        return 1;
      } else if (typeof b === "object") {
        return -1;
      }

      if (!(typeof a in comparators)) {
        throw new Error(
          `Could not compare values in column: ${sort.columnKey} ${typeof a}`
        );
      }

      const comparator = (comparators as any)[typeof a];
      return comparator(a, b) * (sort.direction === "ASC" ? 1 : -1);
    }
    return 0;
  });
  return { rows, sortColumns, onSortColumnsChange: setSortColumns };
};

type AdminTableProps = {
  generations: Generation[];
  setGeneration: (arg0: Generation | null) => void;
};
const AdminTable: React.FC<AdminTableProps> = ({ generations, setGeneration }) => {
  const sortProps = useSortColumns(generations);

  const columns = [
    { key: "filename", name: "Quiz name" },
    { key: "content_tokens", name: "Content size (tokens)", sortable: true },
    { key: "time_to_export", name: "Time to export (minutes)", sortable: true },
    { key: "total_question_edits", name: "Question edits", sortable: true },
    { key: "total_answer_edits", name: "Answer edits", sortable: true },
    { key: "percent_feedback_matching", name: "Matching feedback %", sortable: true, },
    { key: "num_questions", name: "Questions", sortable: true, },
    { key: "percent_answers_scored", name: "% answers scored", sortable: true, },
  ];

  return <DataGrid
    {...sortProps}
    columns={columns}
    onRowClick={setGeneration}
  />;
};

export default AdminTable;
