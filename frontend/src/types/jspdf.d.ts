// src/types/jspdf.d.ts
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: any[][];
      body?: any[][];
      theme?: string;
      headStyles?: {
        fillColor?: string | number[];
        textColor?: string | number[];
        fontStyle?: string;
        fontSize?: number;
      };
      margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
      };
      styles?: any;
      columns?: any[];
      columnStyles?: any;
      tableWidth?: string | number;
      [key: string]: any;
    }) => void;
  }
}