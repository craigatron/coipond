import { db } from "@/firebase/server-config";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  const docRef = db.collection("blueprints").doc(params.slug);
  await docRef.update({
    downloads: FieldValue.increment(1),
  });
  return new Response("ok");
}
