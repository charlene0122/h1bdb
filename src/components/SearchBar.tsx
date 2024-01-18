import * as React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import { NameEntry } from "@/pages/api/employer/autocomplete";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import Link from "next/link";

interface SearchBarProps {
  setFilters: (filters: any) => void; // Define the FilterType according to the shape of your filters
  fetchEmployers: (filters: any) => void;
}

export default function SearchBar({
  setFilters,
  fetchEmployers,
}: SearchBarProps) {
  const [autoCompleteData, setAutoCompleteData] = React.useState<NameEntry[]>(
    []
  );
  const [inputValue, setInputValue] = React.useState("");

  const debounceTimeoutRef = React.useRef<number | null>(null); // Ref to store the timeout ID

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default form submit behavior
      fetchEmployers(inputValue); // Call the fetchEmployers function with the current inputValue
    }
  };
  const fetchAutocompleteData = async (value: string) => {
    try {
      const response = await fetch(
        `/api/employer/autocomplete?prefix=${value}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setAutoCompleteData(data);
    } catch (error) {
      console.error("Error fetching autocomplete data", error);
      // Handle error appropriately
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      prefix: event.target.value,
    }));

    // Clear the previous timeout (if any)
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout
    debounceTimeoutRef.current = window.setTimeout(() => {
      if (event.target.value.length > 0) {
        fetchAutocompleteData(event.target.value);
      } else {
        setAutoCompleteData([]);
      }
    }, 100); // 500ms debounce time
  };

  return (
    <Box sx={{ width: 1 }}>
      <Paper
        component="form"
        sx={{ p: "2px 4px", display: "flex", alignItems: "center", width: 1 }}
        onKeyDown={handleKeyPress}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search H1B Database"
          inputProps={{ "aria-label": "search h1b database" }}
          value={inputValue}
          onChange={handleInputChange}
        />
        <IconButton
          disabled
          type="button"
          sx={{ p: "10px" }}
          aria-label="search"
        >
          <SearchIcon />
        </IconButton>
      </Paper>
      {autoCompleteData && autoCompleteData.length > 0 && (
        <VirtualizedList data={autoCompleteData} />
      )}
    </Box>
  );
}

function renderRow(props: ListChildComponentProps) {
  const { index, style } = props;
  const data = props.data as NameEntry[];

  return (
    <Link href={`/employer/${data[index].id}`} target="_blank">
      <ListItem
        key={data[index].id}
        style={style}
        component="div"
        disablePadding
      >
        <ListItemButton>
          <ListItemText primary={data[index].name} />
        </ListItemButton>
      </ListItem>
    </Link>
  );
}

function VirtualizedList({ data }: { data: NameEntry[] }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: 400,
        bgcolor: "background.paper",
        mt: 1,
      }}
    >
      <FixedSizeList
        height={400}
        width={"100%"}
        itemSize={46}
        itemCount={data.length}
        overscanCount={5}
        itemData={data}
      >
        {renderRow}
      </FixedSizeList>
    </Box>
  );
}
