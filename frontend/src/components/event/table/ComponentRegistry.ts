import type { Component } from 'vue';
import DefaultTableCell from '@/components/event/table/tableCells/DefaultTableCell.vue';
import components from '@/components/event/table/tableCells';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import type { TableCellOptionsProps } from '@/components/event/table/tableCells/TableCellOptionsProps';
import type { CsvFormatContext } from '@/utils/csvValueFormatter';

type Options = object | undefined;

type MaybeLazyComponent<T extends Options> =
  Component<TableCellProps<T>> | (() => Component<TableCellProps<T>>);

type TableCellOptionsComponentProps<T> = TableCellOptionsProps & {
  modelValue?: T;
};

interface ComponentOptions<T extends Options> {
  editable?: false | object;
  internal?: boolean;
  optionsComponent?: Component<TableCellOptionsComponentProps<NoInfer<T>>>;
  toCsv?: (
    value: unknown,
    ctx: CsvFormatContext,
    column: { fieldName: string },
  ) => string;
}

interface ComponentEntry<T extends Options = undefined> {
  component: MaybeLazyComponent<T>;
  options: ComponentOptions<T>;
}

/**
 * Entries stored in the registry have different generic types, so the
 * concrete generic has to be erased after registration. Exported so
 * consumers that hold on to a resolved entry (e.g. TableCellRenderer) can
 * type against it instead of re-deriving their own shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRegistryEntry = ComponentEntry<any>;

const componentMap = new Map<string, ComponentRegistryEntry>();

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

  get(name: string): ComponentRegistryEntry | undefined {
    return componentMap.get(name);
  },

  load(name: string): ComponentRegistryEntry {
    return (
      componentMap.get(name) ?? {
        component: DefaultTableCell,
        options: {},
      }
    );
  },

  all(): ReadonlyMap<string, ComponentRegistryEntry> {
    return componentMap;
  },

  remove(name: string): void {
    componentMap.delete(name);
  },
};

export default TableComponentRegistry;

components();
