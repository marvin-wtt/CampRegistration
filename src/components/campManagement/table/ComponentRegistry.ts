import { Component } from 'vue';
import DefaultTableCell from 'components/campManagement/table/tableCells/DefaultTableCell.vue';
import components from 'components/campManagement/table/tableCells';
import { AnyElement } from 'src/types/SurveyJSCampData';
import { BaseComponent } from 'components/common/inputs/BaseComponent';

type MaybeLazyComponent = Component | (() => Component);

interface ComponentOptions {
  editable?: false | object;
  label?: string | Record<string, string>;
  internal?: boolean;
  edit?: Omit<AnyElement, 'name' | 'title'>;
  customOptions?: BaseComponent[];
}

interface ComponentEntry {
  component: MaybeLazyComponent;
  options: ComponentOptions;
}

const componentMap: Map<string, ComponentEntry> = new Map<
  string,
  ComponentEntry
>();

const TableComponentRegistry = {
  register: (
    name: string,
    component: Component,
    options: ComponentOptions = {},
  ): void => {
    componentMap.set(name, { component, options });
  },

  get: (name: string): ComponentEntry | undefined => {
    return componentMap.get(name);
  },

  load: (name: string): ComponentEntry => {
    const entry = componentMap.get(name);
    if (!entry) {
      return { component: DefaultTableCell, options: {} };
    }

    return entry;
  },

  all: (): Map<string, ComponentEntry> => {
    return componentMap;
  },

  remove: (name: string): void => {
    componentMap.delete(name);
  },
};

export default TableComponentRegistry;

components();
