<template>
  <q-page
    :class="tabBarBottom ? 'reverse' : ''"
    class="column"
  >
    <div class="col-shrink">
      <!-- Desktop navigation -->
      <q-separator v-if="tabBarBottom" />
      <q-tabs
        v-model="tab"
        :inline-label="!tabBarBottom"
        :switch-indicator="tabBarBottom"
        align="justify"
      >
        <q-tab
          :label="t('list')"
          icon="overview"
          name="overview"
        />
        <q-tab
          :label="t('list')"
          icon="list"
          name="list"
        />
        <q-tab
          :label="t('person')"
          icon="person"
          name="person"
        />
      </q-tabs>
      <q-separator v-if="!tabBarBottom" />
    </div>

    <q-tab-panels
      v-model="tab"
      :swipeable="tabBarBottom"
      animated
      class="col"
    >
      <q-tab-panel
        name="overview"
        class="full-height"
      >
      </q-tab-panel>

      <q-tab-panel
        class="absolute"
        name="list"
      >
        <q-scroll-area class="fit">
          <div class="text-h6">
            {{ t('list.title') }}
          </div>

          <q-list separator>
            <!-- TODO Add payment status -->
            <q-item
              v-for="expense in expenses"
              :key="expense.id"
              clickable
            >
              <q-item-section avatar>
                <q-avatar>
                  {{ expense.receiptNumber ?? '-' }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ expense.name }}
                </q-item-label>
                <q-item-label caption>
                  {{ d(expense.date, 'short') }} &middot;
                  {{ expense?.category ?? '-' }}
                </q-item-label>
              </q-item-section>

              <q-item-section
                class="text-bold"
                side
              >
                {{ n(expense.amount, 'currency') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <!-- FIXME FAB is falling from top when switching tabs -->
        <q-btn
          class="absolute-bottom-right q-ma-md"
          color="primary"
          fab
          icon="add"
          style="z-index: 10"
          @click="onAddExpense()"
        />
      </q-tab-panel>

      <q-tab-panel name="person"> Test3</q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { Expense } from '@camp-registration/common/entities';
import ExpenseCreateDialog from 'components/campManagement/expenses/ExpenseCreateDialog.vue';

const { t, d, n } = useI18n();
const quasar = useQuasar();

const tab = ref<string>('list');

const expenses = computed<Expense[]>(() => {
  return [
    {
      id: '1234',
      receiptNumber: 1,
      name: 'First expense',
      category: 'test',
      amount: 100,
      date: new Date().toISOString(),
      paidBy: null,
      recipient: null,
      description: null,
      fileId: null,
      paidAt: null,
    },
  ];
});

const tabBarBottom = computed<boolean>(() => {
  return quasar.platform.has.touch;
});

function onAddExpense() {
  quasar.dialog({
    component: ExpenseCreateDialog,
    componentProps: {
      locales: [],
      people: [],
    },
  });
}
</script>

<i18n lang="yaml" locale="en">
list:
  title: 'Expenses'
</i18n>
