'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateContextType {
  selectedDate: string; // Format: YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  getTodayString: () => string;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate, getTodayString }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}
