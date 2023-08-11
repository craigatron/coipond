import BlueprintList from "@/app/components/BlueprintList/BlueprintList";

export default function Page({ params }: { params: { slug: string } }) {
  return <BlueprintList username={params.slug}></BlueprintList>;
}
