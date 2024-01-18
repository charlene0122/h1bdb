import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { TableVirtuoso, TableComponents } from "react-virtuoso";

export interface GenericData {
  [key: string]: any;
}

interface ColumnData {
  dataKey: string;
  label: string;
  numeric?: boolean;
  width: number;
  render?: (value: any, row: GenericData) => React.ReactNode; // New render function property
}

interface ReactVirtualizedTableProps {
  data: GenericData[];
  columns: ColumnData[];
  height?: number;
}

const VirtuosoTableComponents: TableComponents<GenericData> = {
  // eslint-disable-next-line react/display-name
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{ borderCollapse: "separate", tableLayout: "fixed" }}
    />
  ),
  TableHead,
  TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
  // eslint-disable-next-line react/display-name
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

function fixedHeaderContent(columns: ColumnData[]) {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          align={column.numeric ? "right" : "left"}
          sx={{
            backgroundColor: "background.paper",
            width: column.width,
          }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function rowContent(_index: number, row: GenericData, columns: ColumnData[]) {
  return (
    <React.Fragment>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          align={column.numeric ? "right" : "left"}
        >
          {column.render
            ? column.render(row[column.dataKey], row)
            : row[column.dataKey]}
        </TableCell>
      ))}
    </React.Fragment>
  );
}

export default function VirtualizedTable({
  data,
  columns,
  height,
}: ReactVirtualizedTableProps) {
  return (
    <Paper style={{ height: height ?? 600, width: "100%" }}>
      <TableVirtuoso
        data={data}
        components={VirtuosoTableComponents}
        fixedHeaderContent={() => fixedHeaderContent(columns)}
        itemContent={(index, row) => rowContent(index, row, columns)}
      />
    </Paper>
  );
}
