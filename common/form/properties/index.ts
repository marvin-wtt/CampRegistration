import campDataType from './campDataType';

type PropertyRegistration = {
  className: string;
  propertyInfo: Record<string, unknown> & {
    name: string
  };
};

const properties: PropertyRegistration[] = [
  {
    className: 'question',
    propertyInfo: campDataType,
  }
]

export {
  campDataType,
  properties,
}

export default properties;
