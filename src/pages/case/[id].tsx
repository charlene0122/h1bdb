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
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import InfoCard from "@/components/InfoCard";
import { Case } from "../api/case/[id]";
import { toTitleCase } from "@/utils/helper";

export default function CasePage() {
  const router = useRouter();
  const [caseData, setCaseData] = useState<Case | null>(null);

  const fetchCase = async (value: string) => {
    try {
      const response = await fetch(`/api/case/${value}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setCaseData(data);
    } catch (error) {
      console.error("Error fetching case data", error);
      // Handle error appropriately
    }
  };

  useEffect(() => {
    if (router.query.id) {
      fetchCase(router.query.id as string);
    }
  }, [router.query.id]);

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
      {caseData ? (
        <Container maxWidth="md">
          <Card sx={{ width: 1, mb: 2 }}>
            <CardContent>
              <Typography variant="h3" component="div" gutterBottom>
                {toTitleCase(caseData.job_title)} at{" "}
                {toTitleCase(caseData.employer_name)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Case Number: {caseData.case_number}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                SOC Code: {caseData.soc_code}
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <InfoCard
                title="Received Date"
                content={new Date(caseData.received_date).toLocaleDateString()}
                icon={<CalendarTodayIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoCard
                title="Decision Date"
                content={new Date(caseData.decision_date).toLocaleDateString()}
                icon={<CalendarTodayIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoCard
                title="Status"
                content={caseData.case_status}
                color={getColorFromStatus(caseData.case_status)}
                icon={<HelpOutlineIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoCard
                title="Position Salary"
                content={`$${Number(
                  caseData.wage_rate_of_pay_from
                ).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                icon={<AttachMoneyIcon />}
              />
            </Grid>
          </Grid>
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
