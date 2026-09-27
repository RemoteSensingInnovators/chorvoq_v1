import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chorvoq Reservoir Observatory — 3D, MODIS and ERA5",
  description: "Explore Chorvoq Reservoir in 3D with Sentinel-2 True Color imagery and expanded monthly MODIS and ERA5-Land environmental charts.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
