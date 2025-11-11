import * as echarts from 'echarts/core';
import 'echarts/lib/component/grid'

import {
  LineChart,
  BarChart,
  PictorialBarChart,
  PieChart
} from "echarts/charts";

import {
  GraphicComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
} from "echarts/components";

import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  BarChart,
  PictorialBarChart,
  PieChart,
  GraphicComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  SVGRenderer
])

export default echarts;