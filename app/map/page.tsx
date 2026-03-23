import { Map as MapIcon, Construction } from 'lucide-react'

export default function MapPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <MapIcon className="h-10 w-10" />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Map View
      </h1>
      <p className="max-w-md text-muted-foreground">
        Our interactive map feature is currently under development. Soon you'll be able to browse all properties in Dubai on a live map.
      </p>
      
      <div className="mt-8 flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600">
        <Construction className="h-4 w-4" />
        Coming Soon
      </div>
    </div>
  )
}
