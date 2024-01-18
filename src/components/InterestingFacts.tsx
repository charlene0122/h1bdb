import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { IndustryRank } from "@/pages/api/rank/industry";
import { CityRank } from "@/pages/api/rank/city";
import VirtualizedTable, { GenericData } from "./VirtualizedTable";
import { useEffect, useState } from "react";
import {toTitleCase} from "@/utils/helper";

export default function InterestingFacts() {
  const [cityData, setCityData] = useState<CityRank[]>([]);
  const [industryData, setIndustryData] = useState<IndustryRank[]>([]);

  useEffect(() => {
    fetchCity();
    fetchIndustry();
  }, []);

  const cityColumns = [
    {
      dataKey: "city",
      label: "City",
      width: 100,
      render: (value: string) => toTitleCase(value),
    },
    {
      dataKey: "state",
      label: "State",
      width: 100,
      render: (value: string) => value?.toUpperCase(),
    },
    {
      dataKey: "average_salary",
      label: "Average Salary",
      width: 100,
      numeric: true,
      render: (value: any) => {
        const numberValue = Number(value);
        return numberValue.toLocaleString('en-US', { minimumFractionDigits: 2 });
      }
    },
  ];

  const industryColumns = [
    {
      dataKey: "city",
      label: "City",
      width: 100,
      render: (value: string) => toTitleCase(value),
    },
    {
      dataKey: "state",
      label: "State",
      width: 100,
      render: (value: string) => value?.toUpperCase(),
    },
    {
      dataKey: "num_application",
      label: "Application Count",
      width: 130,
      numeric: true,
      render: (value: number) => value.toLocaleString('en-US'),
    },
  ];

  const fetchCity = async () => {
    try {
      const response = await fetch(`api/rank/city`);
      const data = await response.json();
      setCityData(data);
    } catch (error) {
      console.error("Error fetching industry rank:", error);
    }
  };

  const fetchIndustry = async () => {
    try {
      const response = await fetch(`api/rank/industry`);
      const data = await response.json();
      setIndustryData(data);
    } catch (error) {
      console.error("Error fetching industry rank:", error);
    }
  };

  function renderTable(columns: any, data: any) {
    if (data.length == 0) {
      return (
        <Box sx={{ width: 1, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      );
    }

    return <VirtualizedTable columns={columns} data={data} height={350} />;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="h4" sx={{ my: 2 }}>
          Top 5 Salary City
        </Typography>
        {renderTable(cityColumns, cityData)}
      </Grid>
      <Grid item xs={6}>
        <Typography variant="h4" sx={{ my: 2 }}>
          Top 5 Applications City
        </Typography>
        {renderTable(industryColumns, industryData)}
      </Grid>
    </Grid>
  );
}
