import { type Component } from 'vue';
import DefaultTableCell from 'components/campManagement/table/tableCells/DefaultTableCell.vue';
import components from 'components/campManagement/table/tableCells';
import type { BaseComponent } from 'components/common/inputs/BaseComponent';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import type { TableCellOptionsProps } from 'components/campManagement/table/tableCells/TableCellOptionsProps';

type MaybeLazyComponent =
  | Component<TableCellProps>
  | (() => Component<TableCellProps>);

interface ComponentOptions {
  editable?: false | object;
  label?: string | Record<string, string>;
  internal?: boolean;
  customOptions?: BaseComponent[];
  customOptionsComponent?: Component<TableCellOptionsProps>;
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
    component: Component<TableCellProps>,
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
