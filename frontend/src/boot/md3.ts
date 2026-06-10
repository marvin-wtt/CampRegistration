import { defineBoot } from '#q-app/wrappers';

import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { MBtnGroup } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtnGroup';
import { MFab } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eFab';
import { Md3eFabAction } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eFabAction';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MSlider } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eSlider';

export default defineBoot(({ app }) => {
  app.component('MBtn ', MBtn);
  app.component('MBtnGroup ', MBtnGroup);
  app.component('MFab ', MFab);
  app.component('MFabAction ', Md3eFabAction);
  app.component('m-toolbar ', MToolbar);
  app.component('MSlider ', MSlider);
});
