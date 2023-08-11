import { Box, CircularProgress } from "@mui/material";

export default function Loading() {
  return (
    <Box display="flex">
      <CircularProgress sx={{ margin: "auto" }} size={100} />
    </Box>
  );
}
