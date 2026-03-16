import "recharts";

declare module "recharts" {
  import { ReactNode } from "react";

  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    children?: ReactNode;
    [key: string]: any;
  }

  export interface BarChartProps {
    data?: any[];
    layout?: "horizontal" | "vertical";
    margin?: {
      top?: number;
      right?: number;
      left?: number;
      bottom?: number;
    };
    children?: ReactNode;
    [key: string]: any;
  }

  export interface BarProps {
    dataKey?: string;
    radius?: number | number[];
    animationDuration?: number;
    animationBegin?: number;
    children?: ReactNode;
    [key: string]: any;
  }

  export interface CellProps {
    fill?: string;
    className?: string;
    key?: string;
    [key: string]: any;
  }
}
