interface BlueprintDoc {
  uid: string;
  username: string;
  kind: "b" | "f";
  name: string;
  description: string;
  blueprint: string;
  gameVersion: string;
  views: number;
  downloads: number;
  created: Date;
  updated: Date;
  screenshotUrl?: string;
}

interface BlueprintVersion {
  uid: string;
  versions: {
    blueprint: string;
    gameVersion: string;
    created: Date;
  }[];
}

export { type BlueprintDoc, type BlueprintVersion };
