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
  const response = await fetch('/southern_shops_distributed.csv');
  const csvText = await response.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        const shops: Shop[] = results.data
          .filter((row: any) => row.Shop_ID && row.Shop_Latitude && row.Shop_Longitude)
          .map((row: any) => ({
            id: row.Shop_ID,
            name: row.Shop_Name,
            province: row.Province,
            salesRep: row.Sales_Rep,
            lat: parseFloat(row.Shop_Latitude),
            lng: parseFloat(row.Shop_Longitude),
            checkedIn: row.Visit_Status === 'Checked-in',
            timestamp: row.Checkin_Timestamp || undefined,
            distance: row['Distance_From_Shop(m)'] ? parseFloat(row['Distance_From_Shop(m)']) : undefined,
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
