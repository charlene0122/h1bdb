import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Container,
  CircularProgress,
  FormControl,
  FormLabel,
  Slider,
  SelectChangeEvent,
  TextField,
  Link,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  PieController,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import InfoCard from "@/components/InfoCard";

ChartJS.register(ArcElement, Tooltip, Legend, PieController);
import { EmployerStats } from "../api/employer/[id]";
import { LoadingButton } from "@mui/lab";
import { Position } from "../api/employer/positions";
import VirtualizedTable, { GenericData } from "@/components/VirtualizedTable";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { CaseListingData } from "../api/case/search";
import { toTitleCase } from "@/utils/helper";

export default function Employer() {
  const router = useRouter();
  const [employerData, setEmployerData] = useState<EmployerStats | null>(null);
  const [positionData, setPositionData] = useState<Position[] | null>(null);
  const [caseData, setCaseData] = useState<CaseListingData[] | null>(null);
  const [filters, setFilters] = useState({
    job_category: "",
    min_salary: 0,
    salary_from: 0,
    date_from: dayjs("2000-01-01T00:00:00.000Z"),
    date_to: dayjs(),
  });

  function formatPhoneNumber(phoneNumber: string): string {
    // Remove country code if present
    const cleanedNumber =
      phoneNumber.length === 11 && phoneNumber.startsWith("1")
        ? phoneNumber.substring(1)
        : phoneNumber;

    // Format as US phone number
    const match = cleanedNumber.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
  }

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

  const handleSliderChange = (event: Event, value: number | number[]) => {
    // For single value sliders, the name of the slider should match the filter key
    const name = (event.target as HTMLInputElement)
      .name as keyof typeof filters;
    setFilters({ ...filters, [name]: value });
  };

  const fetchEmployer = async (value: string) => {
    try {
      const response = await fetch(`/api/employer/${value}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setEmployerData(data.result);
    } catch (error) {
      console.error("Error fetching autocomplete data", error);
      // Handle error appropriately
    }
  };

  useEffect(() => {
    if (router.query.id) {
      fetchEmployer(router.query.id as string);
      fetchPositions();
      fetchCases();
    }
  }, [router.query.id]);

  const acceptanceRate = employerData
    ? parseFloat(employerData.acceptance_rate.toString())
    : 0;

  const chartData = {
    labels: ["Accepted", "Rejected"],
    datasets: [
      {
        data: [acceptanceRate, 100 - acceptanceRate],
        backgroundColor: ["#4caf50", "#f6685e"],
        borderWidth: 1,
      },
    ],
  };

  const fetchPositions = async () => {
    setPositionData(null);
    try {
      const query = `/api/employer/positions?min_salary=${
        filters.min_salary
      }&job_category=${filters.job_category}&employer_id=${
        router.query.id as string
      }`;
      const response = await fetch(query);
      if (response.status === 404) {
        setPositionData([]);
      } else {
        const data = await response.json();
        setPositionData(data.result);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const fetchCases = async () => {
    setCaseData(null);
    try {
      const query = `/api/case/search?salary_from=${
        filters.salary_from
      }&date_from=${filters.date_from.format(
        "YYYY-MM-DD"
      )}&date_to=${filters.date_to.format("YYYY-MM-DD")}&employer_id=${
        router.query.id as string
      }`;
      console.log(query);
      const response = await fetch(query);
      if (response.status === 404) {
        setCaseData([]);
      } else {
        const data = await response.json();
        setCaseData(data);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  const renderPositionTable = () => {
    if (positionData === null) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      );
    } else if (positionData.length === 0) {
      return <Typography>No positions found for your conditions.</Typography>;
    }

    // Define columns for your table
    const columns = [
      {
        dataKey: "position",
        label: "Position",
        width: 200,
        render: (value: string) => toTitleCase(value),
      },
      { dataKey: "job_category", label: "Job Category", width: 200 },
      {
        dataKey: "num_application",
        label: "Applications",
        width: 100,
        numeric: true,
      },
      {
        dataKey: "avg_salary",
        label: "Average Salary",
        width: 150,
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
    return (
      <VirtualizedTable height={400} data={positionData} columns={columns} />
    );
  };

  const getColorFromStatus = (status: string) => {
    switch (status) {
      case "Certified":
        return "green";
      case "Certified - Withdrawn":
        return "orange";
      case "Denied":
        return "red";
      case "Withdrawn":
        return "grey";
      default:
        return "black";
    }
  };

  const renderCaseTable = () => {
    if (caseData === null) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      );
    } else if (caseData.length === 0) {
      return <Typography>No cases found for your conditions.</Typography>;
    }

    // Define columns for your table
    const columns = [
      {
        dataKey: "case_number",
        label: "Case Number",
        width: 170,
        render: (value: any) => (
          <Link
            href={`/case/${value}`}
            className="text-blue-600 hover:text-blue-800 visited:text-purple-600"
            target="_blank"
          >
            {value}
          </Link>
        ),
      },
      {
        dataKey: "case_status",
        label: "Case Status",
        width: 100,
        render: (value: any) => {
          return (
            <Typography sx={{ color: getColorFromStatus(value) }}>
              {value}
            </Typography>
          );
        },
      },
      {
        dataKey: "received_date",
        label: "Received Date",
        width: 100,
        render: (value: any) => {
          return <Typography>{dayjs(value).format("DD/MM/YYYY")}</Typography>;
        },
      },
      {
        dataKey: "decision_date",
        label: "Decision Date",
        width: 100,
        render: (value: any) => {
          return <Typography>{dayjs(value).format("DD/MM/YYYY")}</Typography>;
        },
      },
      { dataKey: "soc_code", label: "SOC Code", width: 120 },

      {
        dataKey: "job_title",
        label: "Job Title",
        width: 100,
        render: (value: string) => toTitleCase(value),
      },
      {
        dataKey: "wage_rate_of_pay_from",
        label: "Wage From",
        width: 110,
        numeric: true,
        render: (value: any) => {
          const numberValue = Number(value);
          return numberValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          });
        },
      },
      {
        dataKey: "wage_rate_of_pay_to",
        label: "Wage To",
        width: 100,
        numeric: true,
        render: (value: any) => {
          const numberValue = Number(value);
          return numberValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          });
        },
      },
      { dataKey: "wage_unit_of_pay", label: "Wage Unit", width: 100 },
    ];

    // Use the generalized virtualized table component
    return <VirtualizedTable height={400} data={caseData} columns={columns} />;
  };

  return (
    <Box
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      {employerData ? (
        <Container maxWidth="md">
          <Card sx={{ width: 1, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <CardContent>
                  <Typography variant="h3" component="div" gutterBottom>
                    {toTitleCase(employerData.employer.name)}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <LocationOnIcon sx={{ mr: 1 }} />{" "}
                    {employerData.employer.address},{" "}
                    {toTitleCase(employerData.employer.city)},{" "}
                    {employerData.employer.state.toUpperCase()}
                  </Typography>
                  <Typography
                    sx={{ mb: 1.5, display: "flex", alignItems: "center" }}
                    color="text.secondary"
                  >
                    <PhoneIcon sx={{ mr: 1 }} /> Phone:{" "}
                    {formatPhoneNumber(employerData.employer.phone)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <BusinessIcon sx={{ mr: 1 }} /> Industry:{" "}
                    {employerData.industry}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <PeopleIcon sx={{ mr: 1 }} /> Willful Violator:{" "}
                    {employerData.employer.willful_violator ? "Yes" : "No"}
                  </Typography>
                </CardContent>
              </Grid>
              <Grid
                item
                xs={12}
                md={4}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Box sx={{ height: 220, p: 2 }}>
                  <Pie data={chartData} />
                </Box>
              </Grid>
            </Grid>
          </Card>
          <Grid
            container
            spacing={2}
            sx={{ display: "flex", alignItems: "stretch", mb: 2 }}
          >
            <Grid item xs={12} sm={6}>
              <InfoCard
                title="Number of Applications"
                content={employerData.num_applications.toLocaleString("en-US")}
                icon={<PeopleIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoCard
                title="Average Salary"
                content={Number(employerData.average_salary).toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2 }
                )}
                icon={<AttachMoneyIcon />}
              />
            </Grid>
          </Grid>
          <Card sx={{ p: 2, mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={5}>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Positions
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <FormControl size="small" fullWidth>
                    <FormLabel>Minimum Average Salary</FormLabel>
                    <Slider
                      name="min_salary"
                      value={filters.min_salary}
                      onChange={handleSliderChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={500000}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth>
                    <TextField
                      size="small"
                      name="job_category"
                      label="Job Category"
                      value={filters.job_category}
                      onChange={handleFilterChange}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={1}>
                  <LoadingButton
                    fullWidth
                    onClick={fetchPositions}
                    loading={employerData === null}
                  >
                    Filter
                  </LoadingButton>
                </Grid>
              </Grid>
              {renderPositionTable()}
            </CardContent>
          </Card>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={2}>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Cases
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth>
                    <FormLabel>Minimum Wage To</FormLabel>
                    <Slider
                      name="salary_from"
                      value={filters.salary_from}
                      onChange={handleSliderChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={500000}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth>
                    <FormLabel>Date From</FormLabel>
                    <DatePicker
                      value={filters.date_from}
                      onChange={(newValue) => {
                        setFilters((prevFilters) => ({
                          ...prevFilters,
                          date_from: newValue
                            ? newValue
                            : dayjs("2020-01-01T00:00:00.000Z"),
                        }));
                      }}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth>
                    <FormLabel>Date To</FormLabel>
                    <DatePicker
                      value={filters.date_to}
                      onChange={(newValue) => {
                        setFilters((prevFilters) => ({
                          ...prevFilters,
                          date_to: newValue ? newValue : dayjs(),
                        }));
                      }}
                    />
                  </FormControl>
                </Grid>
                <Grid
                  item
                  xs={1}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <LoadingButton
                    fullWidth
                    onClick={fetchCases}
                    loading={employerData === null}
                  >
                    Filter
                  </LoadingButton>
                </Grid>
              </Grid>
              {renderCaseTable()}
            </CardContent>
          </Card>
        </Container>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            paddingBottom: 64,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}
