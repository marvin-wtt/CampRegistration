import type { Component } from 'vue';
import DefaultTableCell from 'components/campManagement/table/tableCells/DefaultTableCell.vue';
import components from 'components/campManagement/table/tableCells';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import type { TableCellOptionsProps } from 'components/campManagement/table/tableCells/TableCellOptionsProps';

type Options = object | undefined;

type MaybeLazyComponent<T extends Options> =
  | Component<TableCellProps<T>>
  | (() => Component<TableCellProps<T>>);

type TableCellOptionsComponentProps<T> = TableCellOptionsProps & {
  modelValue?: T;
};

interface ComponentOptions<T extends Options> {
  editable?: false | object;
  internal?: boolean;
  optionsComponent?: Component<TableCellOptionsComponentProps<NoInfer<T>>>;
}

interface ComponentEntry<T extends Options = undefined> {
  component: MaybeLazyComponent<T>;
  options: ComponentOptions<T>;
}

/**
 * Entries stored in the registry have different generic types, so the
 * concrete generic has to be erased after registration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoredComponentEntry = ComponentEntry<any>;

const componentMap = new Map<string, StoredComponentEntry>();

const TableComponentRegistry = {
  register<T extends Options = undefined>(
    name: string,
    component: MaybeLazyComponent<T>,
    options: ComponentOptions<NoInfer<T>> = {},
  ): void {
    componentMap.set(name, {
      component,
      options,
    });
  },

  get(name: string): StoredComponentEntry | undefined {
    return componentMap.get(name);
  },

  load(name: string): StoredComponentEntry {
    return (
      componentMap.get(name) ?? {
        component: DefaultTableCell,
        options: {},
      }
    );
  },

  all(): ReadonlyMap<string, StoredComponentEntry> {
    return componentMap;
  },

  remove(name: string): void {
    componentMap.delete(name);
  },
};

export default TableComponentRegistry;

components();
