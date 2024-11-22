// Define the helper function with types
import httpStatus from 'http-status';

function removeProps<T extends object, K extends keyof T>(
  obj: T,
  propsToRemove: K[],
): Omit<T, K> {
  const result = { ...obj }; // Create a shallow copy to avoid mutating the original
  for (const prop of propsToRemove) {
    // eslint-disable-next-line security/detect-object-injection
    delete result[prop];
  }
  return result;
}

export const expenseMinimal = {
  name: 'Some expense',
  amount: 42,
  date: '2024-01-01',
};

type RequestData = {
  name: string;
  data: object;
  statusCode: number;
};

export const expenseCreateRequestData: RequestData[] = [
  {
    name: 'Complete body',
    data: {
      name: 'Some expense',
      description: 'Text expense',
      amount: 42,
      date: '2024-01-01',
      category: 'General',
      paidAt: '2024-01-01',
      paidBy: 'Jhon',
      payee: 'Tom Smith LTT',
    },
    statusCode: httpStatus.CREATED,
  },
  {
    name: 'Minimal body',
    data: expenseMinimal,
    statusCode: httpStatus.CREATED,
  },
  {
    name: 'Negative amount',
    data: {
      ...expenseMinimal,
      amount: -100,
    },
    statusCode: httpStatus.CREATED,
  },
  {
    name: 'Amount with decimals',
    data: {
      ...expenseMinimal,
      amount: 1.11,
    },
    statusCode: httpStatus.CREATED,
  },
  // Invalid
  {
    name: 'Amount missing',
    data: removeProps(expenseMinimal, ['amount']),
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Date missing',
    data: removeProps(expenseMinimal, ['date']),
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Date missing',
    data: removeProps(expenseMinimal, ['name']),
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Amount as invalid string',
    data: {
      ...expenseMinimal,
      amount: '42,3',
    },
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Date format invalid',
    data: {
      ...expenseMinimal,
      amount: '01.01.2024',
    },
    statusCode: httpStatus.BAD_REQUEST,
  },
];

export const expenseUpdateRequestData: RequestData[] = [
  {
    name: 'Complete body',
    data: {
      name: 'Some expense',
      description: 'Text expense',
      amount: 42,
      date: '2024-01-01',
      category: 'General',
      paidAt: '2024-01-01',
      paidBy: 'Jhon',
      payee: 'Tom Smith LTT',
    },
    statusCode: httpStatus.OK,
  },
  {
    name: 'Minimal body',
    data: expenseMinimal,
    statusCode: httpStatus.OK,
  },
  {
    name: 'Negative amount',
    data: {
      ...expenseMinimal,
      amount: -100,
    },
    statusCode: httpStatus.OK,
  },
  {
    name: 'Amount with decimals',
    data: {
      ...expenseMinimal,
      amount: 1.11,
    },
    statusCode: httpStatus.OK,
  },
  // Invalid
  {
    name: 'Amount missing',
    data: removeProps(expenseMinimal, ['amount']),
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Date missing',
    data: removeProps(expenseMinimal, ['date']),
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Date missing',
    data: removeProps(expenseMinimal, ['name']),
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Amount as invalid string',
    data: {
      ...expenseMinimal,
      amount: '42,3',
    },
    statusCode: httpStatus.BAD_REQUEST,
  },
  {
    name: 'Date format invalid',
    data: {
      ...expenseMinimal,
      amount: '01.01.2024',
    },
    statusCode: httpStatus.BAD_REQUEST,
  },
];
