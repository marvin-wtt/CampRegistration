import VueApexCharts from 'vue3-apexcharts';
import { defineBoot } from '#q-app/wrappers';

export default defineBoot(({ app }) => {
  app.use(VueApexCharts);
});
