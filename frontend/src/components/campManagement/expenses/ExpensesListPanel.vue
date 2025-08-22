<template>
  <div>
    <q-scroll-area class="fit">
      <div class="row justify-center">
        <div class="col-xs-12 col-sm-11 col-md-8 col-lg-6 col-xl-4 column">
          <!-- Loading -->
          <q-list
            v-if="loading"
            separator
          >
            <q-item
              v-for="i in 5"
              :key="i"
            >
              <q-item-section avatar>
                <q-skeleton type="QAvatar" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  <q-skeleton
                    type="text"
                    style="width: 150px"
                  />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton
                    type="text"
                    style="width: 100px"
                  />
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-skeleton
                  type="text"
                  style="width: 50px"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <!-- No data -->
          <q-list v-else-if="expenses.length === 0">
            <q-item>
              <q-item-section class="text-center text-italic">
                <q-item-label>
                  {{ t('noData.line1') }}
                </q-item-label>
                <q-item-label caption>
                  {{ t('noData.line2') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Content -->
          <q-list
            v-else
            separator
          >
            <expense-item
              v-for="expense in expenses"
              :key="expense.id"
              :expense
              @click="emit('show', expense)"
            >
              <template #menu>
                <q-list style="min-width: 100px">
                  <q-item
                    v-close-popup
                    clickable
                    @click="emit('show', expense)"
                  >
                    <q-item-section>
                      {{ t('menu.show') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    @click="emit('edit', expense)"
                  >
                    <q-item-section>
                      {{ t('menu.edit') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    class="text-negative"
                    @click="emit('delete', expense)"
                  >
                    <q-item-section>
                      {{ t('menu.delete') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>
            </expense-item>
          </q-list>
        </div>
      </div>
    </q-scroll-area>
  </div>
</template>

<script lang="ts" setup>
import type { Expense } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import ExpenseItem from 'components/campManagement/expenses/ExpenseItem.vue';

const { t } = useI18n();

const { expenses, loading } = defineProps<{
  expenses: Expense[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', expense: Expense): void;
  (e: 'delete', expense: Expense): void;
  (e: 'show', expense: Expense): void;
}>();
</script>

<i18n lang="yaml" locale="en">
menu:
  delete: 'Delete'
  edit: 'Edit'
  show: 'Show'

noData:
  line1: 'There are no expenses yet.'
  line2: 'Add a new expense by pressing the "+" button.'
</i18n>

<i18n lang="yaml" locale="de">
menu:
  delete: 'Löschen'
  edit: 'Bearbeiten'
  show: 'Anzeigen'

noData:
  line1: 'Es gibt noch keine Ausgaben.'
  line2: 'Füge eine neue Ausgabe hinzu, indem du auf die "+"-Schaltfläche drückst.'
</i18n>

<i18n lang="yaml" locale="fr">
menu:
  delete: 'Supprimer'
  edit: 'Editer'
  show: 'Afficher'

noData:
  line1: "Il n'y a pas encore de dépenses."
  line2: 'Ajoute une nouvelle dépense en appuyant sur le bouton "+".'
</i18n>
