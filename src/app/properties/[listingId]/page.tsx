import { PropertyPageClient } from "@/components/property/PropertyPageClient";
import { propertyMetadata } from "@/data/listings";

interface PropertyPageProps {
  params: Promise<{
    listingId: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { listingId } = await params;
  return <PropertyPageClient listingId={listingId} />;
}

export function generateStaticParams() {
  return Object.keys(propertyMetadata).map((listingId) => ({ listingId }));
}
