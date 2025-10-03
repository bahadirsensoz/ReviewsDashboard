import { PropertyPageClient } from "@/components/property/PropertyPageClient";
import { propertyMetadata } from "@/data/listings";

interface PropertyPageProps {
  params: {
    listingId: string;
  };
}

export default function PropertyPage({ params }: PropertyPageProps) {
  return <PropertyPageClient listingId={params.listingId} />;
}

export function generateStaticParams() {
  return Object.keys(propertyMetadata).map((listingId) => ({ listingId }));
}
