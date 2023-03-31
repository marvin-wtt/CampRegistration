import jsep from 'jsep';

export class ExpressionEvaluator {
  public readonly IDENTIFIERS = ['$', '_'];
  private _data?: object;
  private readonly _node: jsep.Expression;

  constructor(expression: string) {
    this._node = jsep(expression);
  }

  evaluate(data: object): jsep.baseTypes {
    this._data = data;

    return this.evaluateAny(this._node);
  }

  private evaluateAny(expression: jsep.Expression): jsep.baseTypes {
    switch (expression.type) {
      case 'ArrayExpression':
        return this.evaluateArrayExpression(expression as jsep.ArrayExpression);
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(
          expression as jsep.BinaryExpression
        );
      case 'CallExpression':
        return this.evaluateCallExpression(expression as jsep.CallExpression);
      case 'ConditionalExpression':
        return this.evaluateConditionalExpression(
          expression as jsep.ConditionalExpression
        );
      case 'Identifier':
        return this.evaluateIdentifier(expression as jsep.Identifier);
      case 'Literal':
        return this.evaluateLiteral(expression as jsep.Literal);
      case 'UnaryExpression':
        return this.evaluateUnaryExpression(expression as jsep.UnaryExpression);
    }

    console.log(expression);

    throw `Unsupported expression type: ${expression.type}`;
  }

  private evaluateArrayExpression(
    expression: jsep.ArrayExpression
  ): jsep.baseTypes[] {
    return expression.elements.map((value) => this.evaluateAny(value));
  }

  private evaluateCallExpression(
    expression: jsep.CallExpression
  ): jsep.baseTypes {
    throw `Unsupported expression call: ${expression.callee}`;
  }

  private evaluateConditionalExpression(
    expression: jsep.ConditionalExpression
  ): jsep.baseTypes {
    const condition = this.evaluateAny(expression.test);

    return condition
      ? this.evaluateAny(expression.consequent)
      : this.evaluateAny(expression.alternate);
  }

  private evaluateBinaryExpression(
    expression: jsep.BinaryExpression
  ): boolean | string | number {
    const left = this.evaluateAny(expression.left);
    const right = this.evaluateAny(expression.right);

    switch (expression.operator) {
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '<':
        if (!isNotNullOrUndefined(left) || !isNotNullOrUndefined(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left < right;
      case '>':
        if (!isNotNullOrUndefined(left) || !isNotNullOrUndefined(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left > right;
      case '&&':
        if (!isBoolean(left) || !isBoolean(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left && right;
      case '||':
        if (!isBoolean(left) || !isBoolean(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left || right;
      case '-':
        if (!isNumber(left) || !isNumber(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left - right;
      case '+':
        if (isNumber(left) && isNumber(right)) {
          return left + right;
        }
        if (isString(left) && isString(right)) {
          return left + right;
        }

        if (!isNumber(left) || !isNumber(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left + right;
    }

    throw `Unsupported expression operator: ${expression.operator}`;
  }

  private evaluateIdentifier(expression: jsep.Identifier): jsep.baseTypes {
    const data = this._data;
    const name = expression.name.substring(1);

    return data !== undefined && name in data
      ? data[name as keyof typeof data]
      : undefined;
  }

  private evaluateLiteral(
    expression: jsep.Literal
  ): string | number | boolean | RegExp | null {
    return expression.value;
  }

  private evaluateUnaryExpression(
    expression: jsep.UnaryExpression
  ): jsep.baseTypes {
    const argument = this.evaluateAny(expression.argument);
    switch (expression.operator) {
      // Logical NOT
      case '!':
        if (!expression.prefix) {
          throw `Unsupported expression unary operator as suffix: ${expression.operator}`;
        }
        return !argument;
      // Negative
      case '-':
        if (!expression.prefix) {
          throw `Unsupported expression unary operator as suffix: ${expression.operator}`;
        }
        if (!isNotNullOrUndefined(argument)) {
          throw `Unsupported expression value for unary operator: ${expression.operator}`;
        }
        return -argument;
    }

    throw `Unsupported expression unary operator: ${expression.operator}`;
  }
}

function isNotNullOrUndefined(
  value: jsep.baseTypes
): value is boolean | number | string | object | RegExp {
  return value !== null && value !== undefined;
}

function isBoolean(value: jsep.baseTypes): value is boolean {
  return typeof value === 'boolean';
}

function isNumber(value: jsep.baseTypes): value is number {
  return typeof value === 'number';
}

function isString(value: jsep.baseTypes): value is string {
  return typeof value === 'string';
}
