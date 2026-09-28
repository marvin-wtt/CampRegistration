import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultTableInteractive from '@/components/event/table/ResultTableInteractive.vue';
import ResultTableInteractiveContent from '@/components/event/table/ResultTableInteractiveContent.vue';
import ResultTableSkeleton from '@/components/event/table/ResultTableSkeleton.vue';
import type { EventDetails } from '@camp-registration/common/entities';

// The table resolves its initial state (selected template, sort) at setup, so
// it must never be created before its data is complete.
describe('ResultTableInteractive', () => {
  const event = { id: 'event' } as EventDetails;

  function mountShell(props: { loading: boolean; event?: EventDetails }) {
    return mount(ResultTableInteractive, {
      props: { questions: [], registrations: [], templates: [], ...props },
      attrs: { class: 'absolute fit' },
      global: {
        stubs: {
          ResultTableInteractiveContent: true,
          ResultTableSkeleton: true,
        },
      },
    });
  }

  it('does not create the table while loading', () => {
    const wrapper = mountShell({ loading: true, event });

    expect(wrapper.findComponent(ResultTableSkeleton).exists()).toBe(true);
    expect(wrapper.findComponent(ResultTableInteractiveContent).exists()).toBe(
      false,
    );
  });

  it('does not create the table without an event', () => {
    const wrapper = mountShell({ loading: false });

    expect(wrapper.findComponent(ResultTableInteractiveContent).exists()).toBe(
      false,
    );
  });

  it('creates the table once loaded, passing the page attrs through', () => {
    const wrapper = mountShell({ loading: false, event });
    const content = wrapper.findComponent(ResultTableInteractiveContent);

    expect(content.exists()).toBe(true);
    expect(content.props('event')).toEqual(event);
    expect(content.classes()).toContain('fit');
  });
});
