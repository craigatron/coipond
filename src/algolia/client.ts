import algoliasearch from "algoliasearch/lite";

interface IndexedBlueprint {
  objectID: string;
  uid: string;
  username: string;
  kind: "b" | "f" | undefined;
  name: string;
  description: string;
  gameVersion: string;
  views: number;
  downloads: number;
  created: number;
  updated: number;
  screenshotUrl?: string;
}

const client = algoliasearch(
  process.env.NEXT_PUBLIC_VITE_ALGOLIA_ID!,
  process.env.NEXT_PUBLIC_VITE_ALGOLIA_KEY!
);

const updatedDescIndex = client.initIndex("blueprints_updated_desc");
const updatedAscIndex = client.initIndex("blueprints_updated_asc");

export { updatedAscIndex, updatedDescIndex, type IndexedBlueprint };
