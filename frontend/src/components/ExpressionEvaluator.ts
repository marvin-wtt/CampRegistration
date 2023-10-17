import jsep from 'jsep';

export class ExpressionEvaluator {
  public readonly IDENTIFIERS = ['$', '_'];
  private _data?: object;
  private readonly _node: jsep.Expression;
  private callables: Record<
    string,
    (...args: jsep.baseTypes[]) => jsep.baseTypes
  > = {};

  constructor(expression: string) {
    // Replace surveyJS style variables (DynamicFormInput.vue)
    expression = expression.replace(/{(.*?)}/g, '_$1');
    jsep.addBinaryOp('=', 0);
    this._node = jsep(expression);
  }

  addFunction(
    name: string,
    callable: (...args: jsep.baseTypes[]) => jsep.baseTypes,
  ): void {
    this.callables[name] = callable;
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
          expression as jsep.BinaryExpression,
        );
      case 'CallExpression':
        return this.evaluateCallExpression(expression as jsep.CallExpression);
      case 'ConditionalExpression':
        return this.evaluateConditionalExpression(
          expression as jsep.ConditionalExpression,
        );
      case 'Identifier':
        return this.evaluateIdentifier(expression as jsep.Identifier);
      case 'MemberExpression':
        return this.evaluateMemberExpression(
          expression as jsep.MemberExpression,
        );
      case 'Literal':
        return this.evaluateLiteral(expression as jsep.Literal);
      case 'UnaryExpression':
        return this.evaluateUnaryExpression(expression as jsep.UnaryExpression);
    }

    throw `Unsupported expression type: ${expression.type}`;
  }

  private evaluateArrayExpression(
    expression: jsep.ArrayExpression,
  ): jsep.baseTypes[] {
    return expression.elements.map((value) => this.evaluateAny(value));
  }

  private evaluateCallExpression(
    expression: jsep.CallExpression,
  ): jsep.baseTypes {
    if (expression.callee.type !== 'Identifier') {
      throw `Unsupported callee type: ${expression.callee.type}`;
    }

    const funcName = (expression.callee as jsep.Identifier).name;
    const func = this.callables[funcName];

    if (func === undefined) {
      throw `Unsupported function name: ${funcName}`;
    }

    const args = expression.arguments.map((value) => {
      return this.evaluateAny(value);
    });

    return func(...args);
  }

  private evaluateConditionalExpression(
    expression: jsep.ConditionalExpression,
  ): jsep.baseTypes {
    const condition = this.evaluateAny(expression.test);

    return condition
      ? this.evaluateAny(expression.consequent)
      : this.evaluateAny(expression.alternate);
  }

  private evaluateBinaryExpression(
    expression: jsep.BinaryExpression,
  ): boolean | string | number {
    let left = this.evaluateAny(expression.left);
    let right = this.evaluateAny(expression.right);

    switch (expression.operator) {
      case '=':
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '<':
        if (isDate(left) && isDate(right)) {
          left = Date.parse(left);
          right = Date.parse(right);
        }
        if (!isNotNullOrUndefined(left) || !isNotNullOrUndefined(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left < right;
      case '>':
        if (isDate(left) && isDate(right)) {
          left = Date.parse(left);
          right = Date.parse(right);
        }
        if (!isNotNullOrUndefined(left) || !isNotNullOrUndefined(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left > right;
      case '<=':
        if (isDate(left) && isDate(right)) {
          left = Date.parse(left);
          right = Date.parse(right);
        }
        if (!isNotNullOrUndefined(left) || !isNotNullOrUndefined(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left <= right;
      case '>=':
        if (isDate(left) && isDate(right)) {
          left = Date.parse(left);
          right = Date.parse(right);
        }
        if (!isNotNullOrUndefined(left) || !isNotNullOrUndefined(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left >= right;
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
      case '*':
        if (!isNumber(left) || !isNumber(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left * right;
      case '/':
        if (!isNumber(left) || !isNumber(right) || right === 0) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left / right;
      case '%':
        if (!isNumber(left) || !isNumber(right)) {
          throw `Unsupported expression values of operator: ${expression.operator}`;
        }
        return left % right;
    }

    throw `Unsupported expression operator: ${expression.operator}`;
  }

  private evaluateIdentifier(
    expression: jsep.Identifier,
    data?: object,
  ): jsep.baseTypes {
    data = data ?? this._data;

    const name = this.IDENTIFIERS.includes(expression.name.charAt(0))
      ? expression.name.substring(1)
      : expression.name;

    return data !== undefined && name in data
      ? data[name as keyof typeof data]
      : undefined;
  }

  private evaluateMemberExpression(
    expression: jsep.MemberExpression,
  ): jsep.baseTypes {
    // expression.computed is not used because I don't know how I should handle it

    if (!['Identifier', 'Literal'].includes(expression.property.type)) {
      throw `Unsupported member expression property type ${expression.property.type}`;
    }

    if (!['Identifier', 'MemberExpression'].includes(expression.object.type)) {
      throw `Unsupported member expression object of type ${expression.object.type}`;
    }

    // Resolve object first
    let parent: jsep.baseTypes | undefined;
    if (expression.object.type === 'MemberExpression') {
      parent = this.evaluateMemberExpression(
        expression.object as jsep.MemberExpression,
      );
    }
    if (expression.object.type === 'Identifier') {
      parent = this.evaluateIdentifier(expression.object as jsep.Identifier);
    }

    // Parents must be an object. Return undefined otherwise to handle errors graceful,
    if (!parent || typeof parent !== 'object') {
      return undefined;
    }

    // Allow array style access
    if (expression.property.type === 'Literal') {
      const literal = expression.property as jsep.Literal;
      if (typeof literal.value !== 'number') {
        throw `Unsupported literal in member expression (${literal.value}). Pleas use dot syntax.`;
      }

      if (!Array.isArray(parent)) {
        return undefined;
      }

      // Allow negative access
      const index =
        literal.value < 0 ? parent.length + literal.value : literal.value;
      if (index < 0 || parent.length <= index) {
        return undefined;
      }

      return parent[index];
    }

    // Normal member style access
    return this.evaluateIdentifier(
      expression.property as jsep.Identifier,
      parent,
    );
  }

  private evaluateLiteral(expression: jsep.Literal): jsep.baseTypes {
    return expression.value;
  }

  private evaluateUnaryExpression(
    expression: jsep.UnaryExpression,
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
  value: jsep.baseTypes,
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

function isDate(value: jsep.baseTypes): value is string {
  return isString(value) && !isNaN(Date.parse(value));
}
