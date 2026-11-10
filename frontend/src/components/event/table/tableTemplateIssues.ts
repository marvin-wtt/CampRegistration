import { useI18n } from 'vue-i18n';
import type { TableTemplateIssue } from '@camp-registration/common/form';

export function useTableTemplateIssueMessage() {
  const { t } = useI18n({ useScope: 'global' });

  return (issue: TableTemplateIssue): string => {
    switch (issue.code) {
      case 'field/unknown': {
        const { field, registrations: count } = issue;
        return count
          ? t('tableTemplates.issue.fieldInUse', { field, count }, count)
          : t('tableTemplates.issue.field', { field });
      }
      case 'value/unknown': {
        const { field, value, registrations: count } = issue;
        return count
          ? t('tableTemplates.issue.valueInUse', { field, value, count }, count)
          : t('tableTemplates.issue.value', { field, value });
      }
      case 'sort/unknown':
        return t('tableTemplates.issue.sort', { column: issue.column });
    }
  };
}
