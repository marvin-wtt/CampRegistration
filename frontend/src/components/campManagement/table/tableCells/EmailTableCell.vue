<template>
  <template v-if="emails === undefined">
    {{ cellProps.value }}
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

const { props: cellProps } = defineProps<TableCellProps>();

interface Email {
  address: string;
  link: string;
}

// Split multiple emails separated with comma or semicolon
const emails = computed<Email[] | undefined>(() => {
  if (typeof cellProps.value !== 'string') {
    return undefined;
  }

  const addresses = cellProps.value.split(/[\s,;]+/);

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
