import { Component, defineAsyncComponent } from 'vue';
import DefaultTableCell from 'components/campManagement/table/tableCells/DefaultTableCell.vue';

export class ComponentRegistry {
  public static INSTANCE: ComponentRegistry = new ComponentRegistry();

  public static BASE_PATH = './tableCells/';
  public static FILE_PREFIX = '';
  public static FILE_SUFFIX = 'TableCell';

  private _components: Map<string, Component> = new Map<string, Component>();

  registerComponent(name: string, component: Component) {
    this._components.set(name, component);
  }

  getComponent(name: string): Component | undefined {
    let component = this._components.get(name);

    if (component !== undefined) {
      return component;
    }

    // Try to load component
    const camelName = name
      .replace(/_\w/g, (m) => m[1].toUpperCase())
      .replace(/^\w/, (c) => c.toUpperCase());

    const componentName =
      ComponentRegistry.BASE_PATH +
      ComponentRegistry.FILE_PREFIX +
      camelName +
      ComponentRegistry.FILE_SUFFIX +
      '.vue';

    try {
      component = defineAsyncComponent({
        loader: () => import(/* @vite-ignore */ componentName),
        errorComponent: DefaultTableCell,
      });

      // Cache it for next iteration
      if (component !== undefined) {
        this.registerComponent(name, component);
      }
    } catch (e: unknown) {}
    return component;
  }

  unregisterComponent(name: string) {
    this._components.delete(name);
  }
}
