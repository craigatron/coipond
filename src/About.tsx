import { Box, Link, Paper, Typography } from "@mui/material";

export default function About() {
  return (
    <Box maxWidth="md" margin="auto" sx={{ mt: 2 }}>
      <Paper sx={{ padding: 3 }} elevation={1}>
        <Typography variant="h5">About</Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          I built this because I love factory games but am consistently terrible
          at actually designing factories in them. Captain of Industry is no
          exception to either of those statements.
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Feel free to get in touch with me at{" "}
          <Link href="mailto:craig@martek.dev">craig@martek.dev</Link> or on the{" "}
          <Link href="https://discord.com/invite/captain-of-industry-803508556325584926">
            Captain of Industry discord
          </Link>{" "}
          with any bugs or feature requests.
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Features coming eventually, roughly in order of my plans to build them
        </Typography>
        <Typography variant="body1" component="div" sx={{ mt: 1 }}>
          <ul>
            <li>See blueprints by user</li>
            <li>Add new versions of an existing blueprint</li>
            <li>Sort by game version</li>
            <li>Update/delete blueprints</li>
            <li>Ratings</li>
            <li>See required research / downgradability</li>
            <li>Support for blueprint folders</li>
            <li>Views/download counts</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
}
