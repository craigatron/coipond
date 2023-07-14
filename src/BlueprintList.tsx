import { ChevronLeft, ChevronRight, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlueprintCard from "./BlueprintCard";
import { useFirebaseAuth } from "./context/FirebaseAuthContext";
import {
  IndexedBlueprint,
  updatedAscIndex,
  updatedDescIndex,
} from "./services/algolia";

const COUNT_PER_PAGE = 20;

export default function BlueprintList() {
  const { user } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [blueprints, setBlueprints] = useState<IndexedBlueprint[]>([]);
  const [sort, setSort] = useState("updated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setBlueprints([]);

    const loadBlueprints = async () => {
      const recentlyDeleted = JSON.parse(
        sessionStorage.getItem("recently-deleted") || "[]"
      ) as string[];
      const index =
        sortDirection === "asc" ? updatedAscIndex : updatedDescIndex;
      const results = await index.search(debouncedSearch || "", {
        page: page,
        hitsPerPage: COUNT_PER_PAGE,
        relevancyStrictness: 0,
      });

      const blueprintsToShow = (results.hits as IndexedBlueprint[]).filter(
        (h) => !recentlyDeleted.includes(h.objectID)
      );

      setCount(results.nbHits);
      setNumPages(results.nbPages);
      setBlueprints(blueprintsToShow);
      setLoading(false);
    };

    loadBlueprints();
  }, [debouncedSearch, page, sortDirection]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);

    return () => clearTimeout(debounce);
  }, [search]);

  const handlePreviousPageClick = async () => {
    setPage(page - 1);
  };

  const handleNextPageClick = () => {
    setPage(page + 1);
  };

  const handleSortDirectionChange = (e: SelectChangeEvent) => {
    setSortDirection(e.target.value as "asc" | "desc");
    setPage(0);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
        <Typography variant="h4">Blueprints</Typography>
        {user === null && (
          <Typography variant="body1">Login to add a blueprint</Typography>
        )}
        {user !== null && (
          <Button component={Link} to="/blueprints/new">
            Add blueprint
          </Button>
        )}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <FormControl sx={{ minWidth: 100 }} size="small">
          <InputLabel id="sort-label">Sort</InputLabel>
          <Select
            labelId="sort-label"
            value={sort}
            label="Sort"
            onChange={(e) => setSort(e.target.value)}
          >
            <MenuItem value={"updated"}>Last updated</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 100 }} size="small">
          <InputLabel id="direction-label">Direction</InputLabel>
          <Select
            labelId="direction-label"
            value={sortDirection}
            label="Direction"
            onChange={handleSortDirectionChange}
          >
            <MenuItem value={"asc"}>Ascending</MenuItem>
            <MenuItem value={"desc"}>Descending</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <TextField
            label="Search"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 600 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search></Search>
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
      </Stack>
      <Box display="flex" sx={{ mt: 4, padding: 2 }}>
        {loading && <CircularProgress size={100} sx={{ margin: "auto" }} />}
        {!loading && blueprints.length === 0 && (
          <Typography variant="h6">No blueprints found</Typography>
        )}
        {!loading && blueprints.length !== 0 && (
          <Stack sx={{ width: "100%" }}>
            <Grid container spacing={2}>
              {blueprints.map((bp) => {
                return (
                  <Grid item key={bp.objectID}>
                    <BlueprintCard
                      blueprintId={bp.objectID}
                      blueprintObj={bp}
                    ></BlueprintCard>
                  </Grid>
                );
              })}
            </Grid>
            <Stack
              direction="row"
              sx={{ mt: 2, alignItems: "center", justifyContent: "center" }}
            >
              {page > 0 && (
                <IconButton
                  aria-label="Previous page"
                  onClick={handlePreviousPageClick}
                >
                  <ChevronLeft></ChevronLeft>
                </IconButton>
              )}
              <Typography variant="body2">
                Displaying {page * COUNT_PER_PAGE + 1}-
                {page * COUNT_PER_PAGE + blueprints.length} of {count}
              </Typography>
              {page + 1 < numPages && (
                <IconButton
                  aria-label="Next page"
                  onClick={handleNextPageClick}
                >
                  <ChevronRight></ChevronRight>
                </IconButton>
              )}
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
