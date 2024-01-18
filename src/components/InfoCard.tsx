import React, { ReactElement } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  SxProps,
  Theme,
} from "@mui/material";

interface InfoCardProps {
  icon: ReactElement;
  title: string;
  content: string | number;
  color?: string; // Optional color field
  sx?: SxProps<Theme>; // Optional: allows styling from outside
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  content,
  color,
  sx,
}) => {
  const iconStyle = { fontSize: 60, flexShrink: 0 };

  return (
    <Card sx={{ height: "100%", ...sx }}>
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontSize: 16 }}>
            {title}
          </Typography>
          <Typography
            variant="h3"
            component="div"
            sx={{ ...(color && { color }) }}
          >
            {content}
          </Typography>
        </Box>
        {React.cloneElement(icon, { sx: iconStyle })}
      </CardContent>
    </Card>
  );
};

export default InfoCard;
