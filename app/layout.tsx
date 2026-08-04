import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chorvoq 3D — Interactive Earth Observation",
  description: "Interactive Chorvoq terrain visualization using Copernicus DEM, Sentinel-2 True Color and Dynamic World land cover.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
