'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { loadShopsFromCSV, Shop } from '@/lib/data';

const GoogleMap = dynamic(() => import('@/components/GoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-xl font-semibold text-gray-500 animate-pulse">กำลังโหลดแผนที่...</div>
    </div>
  )
});

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShopsFromCSV().then((data) => {
      setShops(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col relative">
      <div className="flex-grow w-full h-screen">
        <GoogleMap shops={shops} />
      </div>
    </main>
  );
}
