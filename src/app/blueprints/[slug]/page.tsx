import BlueprintDetails from "@/app/components/BlueprintDetails/BlueprintDetails";
import { BlueprintDoc } from "@/firebase/data";
import {
  db,
  getBlueprint,
  getBlueprintVersions,
} from "@/firebase/server-config";
import { FieldValue } from "firebase-admin/firestore";
import { Metadata } from "next";
import { Twitter } from "next/dist/lib/metadata/types/twitter-types";
import { notFound } from "next/navigation";
import { cache } from "react";

const getBP = cache(async (id: string): Promise<BlueprintDoc | null> => {
  return getBlueprint(id);
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const bpDoc = await getBP(params.slug);
  if (!bpDoc) {
    notFound();
  }

  const title = `The CoI Pond | ${bpDoc.name}`;

  let ogImages, twitter: Twitter;
  if (bpDoc.screenshotUrl) {
    ogImages = [
      {
        url: bpDoc.screenshotUrl,
        alt: "blueprint screenshot",
      },
    ];
    twitter = {
      card: "summary_large_image",
      title,
    };
  } else {
    twitter = {
      card: "summary",
      title,
    };
  }

  return {
    title,
    openGraph: {
      title,
      images: ogImages,
    },
    twitter,
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const bpDoc = await getBP(params.slug);
  if (!bpDoc) {
    notFound();
  }

  const ref = db.collection("blueprints").doc(params.slug);
  await ref.update({
    views: FieldValue.increment(1),
  });

  const versions = (await getBlueprintVersions(params.slug)) || undefined;

  return (
    <BlueprintDetails
      bpId={params.slug}
      bpDoc={bpDoc}
      versions={versions || null}
    ></BlueprintDetails>
  );
}
