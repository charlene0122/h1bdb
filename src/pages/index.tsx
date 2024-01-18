import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  Slider,
  Accordion,
  AccordionSummary,
  Typography,
  Box,
  Button,
  Container,
  Grid,
  FormControl,
  FormLabel,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { EmployerSearch } from "./api/employer/search";
import { SelectChangeEvent } from "@mui/material/Select";
import SearchBar from "@/components/SearchBar";
import VirtualizedTable, { GenericData } from "@/components/VirtualizedTable";
import Link from "next/link";
import InterestingFacts from "@/components/InterestingFacts";
import {toTitleCase} from "@/utils/helper";

const Home = () => {
  const [filters, setFilters] = useState({
    prefix: "",
    city: "",
    state: "",
    min_avg_salary: 0,
    application_count: 0,
    acceptance_rate: 0,
    job_category: "",
    industry: "",
    sort: "application_count",
  });
  const [employers, setEmployers] = useState<EmployerSearch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({ cities: [], states: [] });

  useEffect(() => {
    // Fetch dropdown data for cities and state
    // fetchDropdownData("city");
    fetchEmployers();
    fetchDropdownData("state");
  }, []);

  useEffect(() => {
    if (filters.state) {
      fetchDropdownData("city");
    }
  }, [filters.state]);

  const fetchDropdownData = async (criteria: string) => {
    try {
      const response = await fetch(
        `api/dropdown?criteria=${criteria}&state=${filters.state}`
      );
      const data = await response.json();
      if (criteria === "city") {
        criteria = "cities";
      } else {
        criteria = "states";
      }
      setDropdownData((prev) => ({ ...prev, [criteria]: data.result }));
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchEmployers = async () => {
    setEmployers(null);
    setLoading(true);
    try {
      type QueryParams = {
        [key: string]: string;
      };
      // Convert filters to a format suitable for URLSearchParams
      const queryParams = Object.entries(filters).reduce<QueryParams>(
        (acc, [key, value]) => {
          // Convert array values to a string (e.g., join with a comma)
          if (Array.isArray(value)) {
            acc[key] = value.join(",");
          } else if (key === "acceptance_rate") {
            acc[key] = String((value as number) / 100);
          } else {
            // Ensure the value is a string
            acc[key] = String(value);
          }
          return acc;
        },
        {}
      );

      const query = new URLSearchParams(queryParams).toString();
      console.log(query);
      const response = await fetch(`api/employer/search?${query}`);
      const data = await response.json();
      setEmployers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employers:", error);
    }
  };

  const handleFilterChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const name = target.name as keyof typeof filters;
    const value = target.value;

    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Add sort options
  const sortOptions = [
    { value: "avg_salary", label: "Average Salary: High to Low" },
    {
      value: "application_count",
      label: "Application Count: High to Low",
    },
    { value: "acceptance_rate", label: "Acceptance Rate: High to Low" },
    { value: "name", label: "Employer Name: A to Z" }, // Assuming empty value for default sort
  ];

  // Function to handle slider changes
  const handleSliderChange = (event: Event, value: number | number[]) => {
    // For single value sliders, the name of the slider should match the filter key
    const name = (event.target as HTMLInputElement)
      .name as keyof typeof filters;
    setFilters({ ...filters, [name]: value });
  };

  const renderTable = () => {
    if (employers === null) {
      return <></>;
    } else if (employers.length === 0) {
      return <Typography>No employers found for your conditions.</Typography>;
    }

    // Define columns for your table
    const columns = [
      {
        dataKey: "name",
        label: "Name",
        width: 200,
        render: (value: any, row: GenericData) => (
          <Link
            href={`/employer/${row.id}`}
            className="text-blue-600 hover:text-blue-800 visited:text-purple-600"
            target="_blank"
          >
            {toTitleCase(value)}
          </Link>
        ),
      },
      {
        dataKey: "city",
        label: "City",
        width: 100,
        render: (value: string) => toTitleCase(value),
      },
      {
        dataKey: "state",
        label: "State",
        width: 50,
        render: (value: string) => value?.toUpperCase(),
      },
      { dataKey: "industry", label: "Industry", width: 150 },
      {
        dataKey: "application_count",
        label: "Applications",
        width: 100,
        numeric: true,
        render: (value: number) => value.toLocaleString("en-US"),
      },
      {
        dataKey: "acceptance_rate",
        label: "Acceptance Rate",
        width: 100,
        numeric: true,
        render: (value: any) => `${Math.round(value * 100)}%`,
      },
      {
        dataKey: "avg_salary",
        label: "Average Salary",
        width: 120,
        numeric: true,
        render: (value: any) => {
          const numberValue = Number(value);
          return numberValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          });
        },
      },
    ];

    // Use the generalized virtualized table component
    return <VirtualizedTable data={employers} columns={columns} />;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-12">
      <Container
        maxWidth="md"
        className="flex flex-col items-center justify-center"
      >
        <Typography
          variant="h2"
          sx={{ fontWeight: "bold", textAlign: "center", mb: 3 }}
        >
          H1B DB
        </Typography>
        <SearchBar setFilters={setFilters} fetchEmployers={fetchEmployers} />

        {/* Filter Rows */}
        <Card sx={{ width: "100%", mb: 2, mt: 2, p: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              {/* State Dropdown */}
              <Grid item xs={4}>
                <FormControl size="small" fullWidth>
                  <FormLabel>State</FormLabel>
                  <Select
                    fullWidth
                    name="state"
                    value={filters.state}
                    onChange={handleFilterChange}
                  >
                    {dropdownData.states.map((s: string) => (
                      <MenuItem key={s} value={s}>
                        {s.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* City Dropdown */}
              <Grid item xs={4}>
                <FormControl size="small" fullWidth>
                  <FormLabel>City</FormLabel>
                  <Select
                    fullWidth
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    disabled={
                      !dropdownData.cities || dropdownData.cities.length == 0
                    }
                  >
                    {dropdownData.cities.map((c: string) => (
                      <MenuItem key={c} value={c}>
                        {toTitleCase(c)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort Dropdown */}
              <Grid item xs={4}>
                <FormControl size="small" fullWidth>
                  <FormLabel>Sort By</FormLabel>
                  <Select
                    fullWidth
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                    defaultValue="name"
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              {/* Salary Range Slider */}
              <Grid item xs={4}>
                <FormControl size="small" fullWidth>
                  <FormLabel>Salary Range</FormLabel>
                  <Slider
                    name="min_avg_salary"
                    value={filters.min_avg_salary}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={500000}
                  />
                </FormControl>
              </Grid>

              {/* Application Count Slider */}
              <Grid item xs={4}>
                <FormControl size="small" fullWidth>
                  <FormLabel>Application Count</FormLabel>
                  <Slider
                    name="application_count"
                    value={filters.application_count}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={500}
                  />
                </FormControl>
              </Grid>

              {/* Acceptance Rate Slider */}
              <Grid item xs={4}>
                <FormControl size="small" fullWidth>
                  <FormLabel>Acceptance Rate</FormLabel>
                  <Slider
                    name="acceptance_rate"
                    value={filters.acceptance_rate}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                  />
                </FormControl>
              </Grid>
            </Grid>
            {/* Advanced Features Row */}
            <Box sx={{ width: "100%", mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Advanced Filters</Typography>
                    </AccordionSummary>
                    <Box sx={{ pr: 2, pb: 3, pl: 2 }}>
                      {/* Job Category Input */}
                      <TextField
                        size="small"
                        fullWidth
                        name="job_category"
                        label="Job Category"
                        value={filters.job_category}
                        onChange={handleFilterChange}
                      />

                      {/* Industry Input */}
                      <TextField
                        size="small"
                        fullWidth
                        name="industry"
                        label="Industry"
                        value={filters.industry}
                        onChange={handleFilterChange}
                        sx={{ mt: 2 }}
                      />
                    </Box>
                  </Accordion>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
          <CardActions>
            {/* Search Button */}
            <LoadingButton
              variant="contained"
              fullWidth
              onClick={fetchEmployers}
              size="large"
              className="main-button"
              loading={loading}
            >
              Search
            </LoadingButton>
          </CardActions>
        </Card>

        {/* Render Table */}
        {renderTable()}

        <InterestingFacts />
      </Container>
    </main>
  );
};

export default Home;
