import Papa from 'papaparse';

export interface Shop {
  id: string;
  name: string;
  province: string;
  salesRep: string;
  lat: number;
  lng: number;
  checkedIn: boolean;
  timestamp?: string;
  distance?: number;
  remark?: string;
  address: string;
}

// Parse CSV data
export async function loadShopsFromCSV(): Promise<Shop[]> {
  const response = await fetch('/thailand_shops_full_coverage.csv');
  const csvText = await response.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        const shops: Shop[] = results.data
          .filter((row: any) => row.Shop_ID && row.Shop_Lat && row.Shop_Lon)
          .map((row: any) => ({
            id: row.Shop_ID,
            name: row.Shop_Name,
            province: row.Province,
            salesRep: row.Region || '-',
            lat: parseFloat(row.Shop_Lat),
            lng: parseFloat(row.Shop_Lon),
            checkedIn: row.Visit_Status === 'Checked-in',
            timestamp: row.Checkin_Time || undefined,
            distance: row.Distance_m ? parseFloat(row.Distance_m) : undefined,
            remark: row.Remark || undefined,
            address: `${row.Province}, ไทย`,
          }));
        resolve(shops);
      },
    });
  });
}

// For static export - we'll need to load this at build time
// For now, return empty array and load dynamically
export const shops: Shop[] = [];
