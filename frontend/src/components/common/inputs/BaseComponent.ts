import {
  QCheckboxProps,
  QInputProps,
  QOptionGroupProps,
  QRadioProps,
  QSelectProps,
  QSliderProps,
  QToggleProps
} from 'quasar';

interface ComponentWrapper {
  name: string;
}

type ComponentProps<T> = Omit<T, 'modelValue'> & ComponentWrapper;

export interface CheckboxComponent extends ComponentProps<QCheckboxProps> {
  componentType: 'checkbox';
}

export interface InputComponent extends ComponentProps<QInputProps> {
  componentType: 'input';
}

export interface OptionGroupComponent
  extends ComponentProps<QOptionGroupProps> {
  componentType: 'option-group';
}

export interface RadioComponent extends ComponentProps<QRadioProps> {
  componentType: 'radio';
}

export interface SelectComponent extends ComponentProps<QSelectProps> {
  componentType: 'select';
}

export interface SliderComponent extends ComponentProps<QSliderProps> {
  componentType: 'slider';
}

export interface ToggleComponent extends ComponentProps<QToggleProps> {
  componentType: 'toggle';
}

export type BaseComponent =
  | CheckboxComponent
  | InputComponent
  | OptionGroupComponent
  | RadioComponent
  | SelectComponent
  | SliderComponent
  | ToggleComponent;
