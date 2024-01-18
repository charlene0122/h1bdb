import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import StorageIcon from "@mui/icons-material/Storage";
import { useRouter } from "next/router";

function NavBar() {
  const router = useRouter();
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <StorageIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              router.push("/");
            }}
          >
            H1BDB
          </Typography>

          <StorageIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default NavBar;
