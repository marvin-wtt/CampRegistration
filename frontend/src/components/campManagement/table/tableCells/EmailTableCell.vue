<template>
  <template v-if="emails === undefined">
    {{ props.props.value }}
  </template>

  <a
    v-for="(email, index) in emails"
    v-else
    :key="index"
    :href="email.link"
  >
    {{ email.address + ' ' }}
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();

interface Email {
  address: string;
  link: string;
}

// Split multiple emails separated with comma or semicolon
const emails = computed<Email[] | undefined>(() => {
  if (typeof props.props.value !== 'string') {
    return undefined;
  }

  const addresses = props.props.value.split(/[\s,;]+/);

  const emails: Email[] = [];
  addresses.forEach((value) => {
    emails.push({
      address: value,
      link: 'mailto:' + value,
    });
  });

  return emails;
});
</script>

<style lang="scss" scoped>
.body--light {
  a {
    color: #000;
  }
}

.body--dark {
  a {
    color: #fff;
  }
}

a {
  text-decoration: none;
}
</style>
