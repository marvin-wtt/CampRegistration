import { describe, expect, it } from 'vitest';
import { privacyIssueKind } from '../../../src/form/privacyCompliance.js';

describe('privacyIssueKind', () => {
  const issues = { undeclared: ['religion', 'health'], uncovered: ['health'] };

  it('names the issue a category raises', () => {
    expect(privacyIssueKind('religion', issues)).toBe('undeclared');
    expect(privacyIssueKind('allergies', issues)).toBeNull();
  });

  it('reports undeclared before uncovered', () => {
    expect(privacyIssueKind('health', issues)).toBe('undeclared');
  });
});
