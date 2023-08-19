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

const indices = {
  updated_desc: client.initIndex("blueprints_updated_desc"),
  updated_asc: client.initIndex("blueprints_updated_asc"),
  downloads_desc: client.initIndex("blueprints_downloads_desc"),
  downloads_asc: client.initIndex("blueprints_downloads_asc"),
  views_desc: client.initIndex("blueprints_views_desc"),
  views_asc: client.initIndex("blueprints_views_asc"),
};

export { indices, type IndexedBlueprint };
