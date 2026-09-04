<template>
  <q-page class="landing">
    <!-- ====================================================== HERO -->
    <section
      class="landing__section hero"
      aria-labelledby="landing-hero-title"
    >
      <div
        class="hero__glow"
        aria-hidden="true"
      />

      <div class="hero__eyebrow anim anim--1">
        <q-icon
          name="code"
          size="16px"
        />
        <span>{{ t('hero.eyebrow') }}</span>
      </div>

      <h1
        id="landing-hero-title"
        class="hero__title anim anim--2"
      >
        {{ t('hero.title') }}
        <br />
        <span class="hero__highlight">{{ t('hero.title_highlight') }}</span>
      </h1>

      <p class="hero__subtitle anim anim--3">
        {{ t('hero.subtitle') }}
      </p>

      <ul
        class="hero__proof anim anim--3"
        :aria-label="t('hero.proof_label')"
      >
        <li
          v-for="proof in proofPoints"
          :key="proof.name"
        >
          <q-icon
            :name="proof.icon"
            size="16px"
          />
          {{ t(`hero.proof.${proof.name}`) }}
        </li>
      </ul>

      <div class="hero__actions anim anim--4">
        <m-btn
          :label="organizerCtaLabel"
          :to="organizerCtaTo"
          primary
          icon-right="arrow_forward"
          size="17px"
          padding="14px 28px"
          no-caps
          data-test="landing-organizer-cta"
        />
        <m-btn
          v-if="!user"
          :label="t('organizers.action_login')"
          :to="{ name: 'login' }"
          text
          size="16px"
          no-caps
          data-test="landing-login"
        />
      </div>

      <!-- The participant's exit from an otherwise organizer-facing hero: one
           lane straight to the open event list, no pitch to read first. -->
      <router-link
        class="fasttrack anim anim--5"
        :to="{ name: 'events' }"
        data-test="landing-participant-cta"
      >
        <span class="fasttrack__icon">
          <q-icon
            name="how_to_reg"
            size="26px"
          />
        </span>

        <span class="fasttrack__copy">
          <strong class="fasttrack__title">{{ t('fasttrack.title') }}</strong>
          <span class="fasttrack__text">{{ t('fasttrack.text') }}</span>
          <span class="fasttrack__points">
            <span
              v-for="point in ['point_1', 'point_2', 'point_3']"
              :key="point"
            >
              <q-icon
                name="check"
                size="15px"
              />
              {{ t(`fasttrack.${point}`) }}
            </span>
          </span>
        </span>

        <span class="fasttrack__action">
          <span class="fasttrack__action-label">
            {{ t('fasttrack.action') }}
          </span>
          <q-icon
            name="arrow_forward"
            size="20px"
          />
        </span>
      </router-link>
    </section>

    <!-- ================================================== FEATURES -->
    <landing-features class="landing__section" />

    <!-- ===================================================== STEPS -->
    <section
      class="landing__section steps"
      aria-labelledby="landing-steps-title"
    >
      <h2
        id="landing-steps-title"
        class="section-title"
      >
        {{ t('step.title') }}
      </h2>
      <p class="section-subtitle">{{ t('step.subtitle') }}</p>

      <div class="steps__tracks">
        <div
          v-for="track in tracks"
          :key="track.name"
          class="track"
          :class="`track--${track.name}`"
        >
          <div class="track__head">
            <q-icon
              :name="track.icon"
              size="20px"
            />
            <h3 class="track__title">{{ t(`step.${track.name}.title`) }}</h3>
          </div>

          <ol class="track__list">
            <li
              v-for="(step, index) in ['one', 'two', 'three']"
              :key="step"
              class="track__step"
            >
              <span
                class="track__number"
                aria-hidden="true"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p class="track__step-title">
                  {{ t(`step.${track.name}.${step}.title`) }}
                </p>
                <p class="track__step-text">
                  {{ t(`step.${track.name}.${step}.text`) }}
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ================================================= SELF-HOST -->
    <section
      class="landing__section selfhost"
      aria-labelledby="landing-selfhost-title"
    >
      <div class="selfhost__card">
        <div class="selfhost__content">
          <span class="selfhost__eyebrow">{{ t('selfhost.eyebrow') }}</span>
          <h2
            id="landing-selfhost-title"
            class="selfhost__title"
          >
            {{ t('selfhost.title') }}
          </h2>
          <p class="selfhost__text">{{ t('selfhost.text') }}</p>

          <ul class="selfhost__points">
            <li
              v-for="point in ['point_1', 'point_2', 'point_3']"
              :key="point"
            >
              <q-icon
                name="check_circle"
                size="20px"
              />
              {{ t(`selfhost.${point}`) }}
            </li>
          </ul>

          <m-btn
            :label="t('selfhost.action')"
            href="https://github.com/marvin-wtt/EventRegistration"
            target="_blank"
            rel="noopener"
            tonal
            icon="code"
            icon-right="open_in_new"
            no-caps
            data-test="landing-github"
          />
        </div>

        <div
          class="selfhost__terminal"
          aria-hidden="true"
        >
          <div class="selfhost__terminal-bar">
            <span />
            <span />
            <span />
          </div>
          <!-- No indentation inside <pre>: it would be rendered verbatim. -->
          <pre
            class="selfhost__terminal-body"
          ><span class="t-dim"># {{ t('selfhost.terminal_comment') }}</span>
<span class="t-prompt">$</span> git clone marvin-wtt/EventRegistration
<span class="t-prompt">$</span> docker compose up -d
<span class="t-ok">✓</span> {{ t('selfhost.terminal_done') }}</pre>
        </div>
      </div>
    </section>

    <!-- ======================================================= CTA -->
    <section
      class="landing__section cta"
      aria-labelledby="landing-cta-title"
    >
      <div class="cta__card">
        <h2
          id="landing-cta-title"
          class="cta__title"
        >
          {{ t('cta.title') }}
        </h2>
        <p class="cta__text">{{ t('cta.text') }}</p>
        <m-btn
          :label="organizerCtaLabel"
          :to="organizerCtaTo"
          elevated
          icon-right="arrow_forward"
          size="16px"
          class="cta__btn"
          no-caps
          data-test="landing-bottom-cta"
        />
        <p class="cta__hint">
          {{ t('cta.participant_hint') }}
          <router-link :to="{ name: 'events' }">
            {{ t('cta.participant_link') }}
          </router-link>
        </p>
      </div>
    </section>
  </q-page>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile-store';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import LandingFeatures from '@/components/landing/LandingFeatures.vue';

const { t } = useI18n();
const profileStore = useProfileStore();
const { user } = storeToRefs(profileStore);

useMeta(() => ({
  title: t('meta_title'),
  meta: {
    description: {
      name: 'description',
      content: t('meta_description'),
    },
  },
}));

const organizerCtaLabel = computed<string>(() =>
  user.value ? t('organizers.action_authed') : t('organizers.action'),
);

const organizerCtaTo = computed(() =>
  user.value ? { name: 'management.events' } : { name: 'register' },
);

const proofPoints = [
  { name: 'open_source', icon: 'code' },
  { name: 'self_host', icon: 'dns' },
  { name: 'languages', icon: 'translate' },
  { name: 'no_account', icon: 'person_off' },
] as const;

const tracks = [
  { name: 'organizer', icon: 'admin_panel_settings' },
  { name: 'participant', icon: 'hiking' },
] as const;
</script>

<style lang="scss" scoped>
/*
 * Built entirely on the MD3 design tokens (--md3-*) exposed by
 * @anoyomoose/q2-fresh-paint-md3e, so light and dark themes both work
 * without manual overrides.
 */
.landing {
  /* The theme ships shape and motion as Sass variables only, so mirror the
   * ones used here as custom properties. Values from its variables.scss. */
  --md3-corner-large: 16px;
  --md3-corner-extra-large: 28px;
  --md3-corner-full: 9999px;
  --md3-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md3-easing-emphasized-decel: cubic-bezier(0.05, 0.7, 0.1, 1);

  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px 48px;
  overflow-x: clip;
}

.landing__section {
  width: 100%;
  max-width: 1080px;
}

.section-title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--md3-on-surface);
}

.section-subtitle {
  max-width: 56ch;
  margin: 12px 0 0;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--md3-on-surface-variant);
}

/* ========================================================== HERO */
.hero {
  position: relative;
  padding: clamp(32px, 7vh, 112px) 0 24px;
}

.hero__glow {
  position: absolute;
  inset: -40% -30% auto;
  height: 130%;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(
      42% 55% at 18% 28%,
      rgba(var(--md3-primary-rgb), 0.14),
      transparent 70%
    ),
    radial-gradient(
      36% 50% at 85% 18%,
      rgba(var(--md3-primary-rgb), 0.08),
      transparent 70%
    );
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-full);
  color: var(--md3-primary);
  background: var(--md3-surface-container-low);
}

.hero__title {
  margin: 24px 0 0;
  font-size: clamp(2.4rem, 6.5vw, 4.25rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.06;
  color: var(--md3-on-surface);
}

.hero__highlight {
  display: inline-block;
  padding: 0.04em 0.35em 0.1em;
  border-radius: 0.32em 0.9em 0.32em 0.9em;
  transform: rotate(-1.2deg);
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.hero__subtitle {
  max-width: 58ch;
  margin: 20px 0 0;
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  line-height: 1.6;
  color: var(--md3-on-surface-variant);
}

.hero__proof {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.hero__proof li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--md3-on-surface-variant);
}

.hero__proof .q-icon {
  color: var(--md3-tertiary);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 32px;
}

/* ================================================== PARTICIPANTS */
/* One wide lane to the event list — the counterpart to the organizer
 * buttons above it, in tertiary so the two never compete. */
.fasttrack {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2.5vw, 24px);
  margin-top: clamp(32px, 6vh, 56px);
  padding: clamp(20px, 3vw, 28px) clamp(20px, 3vw, 32px);
  text-decoration: none;
  border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
    64px var(--md3-corner-extra-large);
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
  transition:
    transform 0.35s var(--md3-easing-emphasized),
    border-radius 0.35s var(--md3-easing-emphasized),
    box-shadow 0.35s var(--md3-easing-emphasized);
}

.fasttrack:hover,
.fasttrack:focus-visible {
  border-radius: var(--md3-corner-extra-large) 64px
    var(--md3-corner-extra-large) 64px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
}

@media (prefers-reduced-motion: no-preference) {
  .fasttrack:hover,
  .fasttrack:focus-visible {
    transform: translateY(-3px);
  }
}

.fasttrack__icon {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 14px;
  border-radius: var(--md3-corner-large);
  color: var(--md3-tertiary-container);
  background: var(--md3-on-tertiary-container);
}

.fasttrack__copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.fasttrack__title {
  font-size: clamp(1.15rem, 2vw, 1.5rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.fasttrack__text {
  font-size: 1rem;
  line-height: 1.5;
  opacity: 0.85;
}

.fasttrack__points {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.fasttrack__points > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.fasttrack__points .q-icon {
  opacity: 0.7;
}

.fasttrack__action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  border-radius: var(--md3-corner-full);
  color: var(--md3-tertiary-container);
  background: var(--md3-on-tertiary-container);
}

.fasttrack__action .q-icon {
  transition: transform 0.25s var(--md3-easing-emphasized);
}

.fasttrack:hover .fasttrack__action .q-icon,
.fasttrack:focus-visible .fasttrack__action .q-icon {
  transform: translateX(4px);
}

/* ========================================================= STEPS */
.steps {
  padding-top: clamp(56px, 10vh, 104px);
}

.steps__tracks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.track {
  padding: clamp(24px, 3vw, 32px);
  border-radius: 32px;
  background: var(--md3-surface-container-low);
}

.track--organizer {
  border: 1px solid var(--md3-outline-variant);
}

.track--participant {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

.track__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.track__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.track__list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: track;
}

.track__step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.track__number {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 0.9rem;
  font-weight: 800;
  border-radius: 50%;
  color: var(--md3-on-primary);
  background: var(--md3-primary);
}

.track--participant .track__number {
  color: var(--md3-on-tertiary);
  background: var(--md3-tertiary);
}

.track__step-title {
  margin: 4px 0 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.track__step-text {
  margin: 6px 0 0;
  font-size: 0.92rem;
  line-height: 1.5;
  opacity: 0.85;
}

.track--organizer .track__step-text {
  color: var(--md3-on-surface-variant);
  opacity: 1;
}

/* ===================================================== SELF-HOST */
.selfhost {
  padding-top: clamp(56px, 10vh, 104px);
}

.selfhost__card {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(24px, 4vw, 48px);
  align-items: center;
  padding: clamp(28px, 4vw, 48px);
  border: 1px solid var(--md3-outline-variant);
  border-radius: 40px;
  background: var(--md3-surface-container-low);
}

.selfhost__eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md3-tertiary);
}

.selfhost__title {
  margin: 12px 0 0;
  font-size: clamp(1.5rem, 2.8vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--md3-on-surface);
}

.selfhost__text {
  margin: 14px 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--md3-on-surface-variant);
}

.selfhost__points {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0 24px;
  padding: 0;
  list-style: none;
}

.selfhost__points li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: var(--md3-on-surface);
}

.selfhost__points .q-icon {
  color: var(--md3-tertiary);
}

/* Decorative terminal — inverse surface flips correctly in dark mode */
.selfhost__terminal {
  border-radius: var(--md3-corner-extra-large);
  background: var(--md3-inverse-surface);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.selfhost__terminal-bar {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.25);
}

.selfhost__terminal-bar span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--md3-inverse-on-surface);
  opacity: 0.35;
}

.selfhost__terminal-body {
  margin: 0;
  padding: 18px 20px 22px;
  font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--md3-inverse-on-surface);
}

.t-prompt {
  color: var(--md3-inverse-primary);
  font-weight: 700;
}

.t-dim {
  opacity: 0.55;
}

.t-ok {
  color: var(--md3-inverse-tertiary);
  font-weight: 700;
}

/* =========================================================== CTA */
.cta {
  padding-top: clamp(56px, 10vh, 104px);
}

.cta__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px);
  border-radius: 48px 48px 48px 96px;
  text-align: center;
  color: var(--md3-on-primary);
  background: var(--md3-primary);
}

.cta__title {
  margin: 0;
  font-size: clamp(1.7rem, 3.4vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.cta__text {
  margin: 12px 0 24px;
  font-size: 1.05rem;
  opacity: 0.9;
}

/* Invert the filled button so it pops on the primary band.
 * Scoped under .cta__card to out-specify the theme's .q-btn.bg-primary rule —
 * otherwise only the text color flips and we get primary-on-primary. */
.cta__card .cta__btn {
  background-color: var(--md3-on-primary) !important;
  color: var(--md3-primary) !important;
}

.cta__hint {
  margin: 20px 0 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.cta__hint a {
  color: inherit;
  font-weight: 600;
  text-underline-offset: 3px;
}

/* ===================================================== ENTRANCE */
@media (prefers-reduced-motion: no-preference) {
  .anim {
    animation: landing-rise 0.7s var(--md3-easing-emphasized-decel) both;
  }

  .anim--1 {
    animation-delay: 0.05s;
  }

  .anim--2 {
    animation-delay: 0.15s;
  }

  .anim--3 {
    animation-delay: 0.25s;
  }

  .anim--4 {
    animation-delay: 0.35s;
  }

  .anim--5 {
    animation-delay: 0.5s;
  }
}

@keyframes landing-rise {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================================================== RESPONSIVE */
@media (max-width: 900px) {
  .selfhost__card {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 700px) {
  /* Tighten the top: less dead space and a smaller open-source badge */
  .hero {
    padding-top: 16px;
  }

  .hero__eyebrow {
    padding: 4px 10px;
    font-size: 0.72rem;
  }

  .hero__title {
    margin-top: 16px;
  }

  .steps__tracks {
    grid-template-columns: minmax(0, 1fr);
  }

  /* Stack the lane: the action becomes a full-width button under the copy. */
  .fasttrack {
    flex-wrap: wrap;
    border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
      48px var(--md3-corner-extra-large);
  }

  .fasttrack__copy {
    flex-basis: 0;
  }

  .fasttrack__action {
    flex: 1 1 100%;
    justify-content: center;
  }
}
</style>

<i18n lang="yaml" locale="en">
meta_title: 'Event management made simple'
meta_description: '@:app_name is an open-source platform for organizing events: online registration forms, participant lists, room and program planning, automatic emails, and newsletters.'
fasttrack:
  title: 'Here to sign up for an event?'
  text: 'Every event currently open for registration, in one list.'
  point_1: 'No account, no password'
  point_2: 'A few minutes on your phone'
  point_3: 'In your own language'
  action: 'Find your event'
hero:
  eyebrow: 'Open-source event management'
  title: 'Run your event,'
  title_highlight: 'not your paperwork'
  subtitle: '@:app_name brings registrations, participants, rooms, program and communication together in one place — built by event organizers, for event organizers.'
  proof_label: 'What @:app_name gives you'
  proof:
    open_source: 'Open source, AGPLv3'
    self_host: 'Self-hostable'
    languages: 'Five languages'
    no_account: 'No account needed to register'
organizers:
  action: 'Get started'
  action_authed: 'Open management'
  action_login: 'Sign in'
step:
  title: 'How it works'
  subtitle: 'Two short paths — one for the people running the event, one for the people joining it.'
  organizer:
    title: 'If you organize'
    one:
      title: 'Create your event'
      text: 'Set dates, capacity and age range, then build your registration form.'
    two:
      title: 'Share your link'
      text: 'Registrations arrive in your list, and the confirmation email goes out by itself.'
    three:
      title: 'Run the event'
      text: 'Assign rooms, plan the program and duties, and keep everyone informed.'
  participant:
    title: 'If you sign up'
    one:
      title: 'Find your event'
      text: 'Browse the open events, or open the link the organizer sent you.'
    two:
      title: 'Fill in the form'
      text: 'A few minutes on any device, in your language — no account required.'
    three:
      title: 'Get your confirmation'
      text: 'An email confirms your spot, with the details and the privacy information.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Your event, your data — your server, if you want'
  text: '@:app_name is fully open source. Use it right here, or self-host the entire platform on your own infrastructure — so participant data never leaves your hands.'
  point_1: 'AGPLv3-licensed with no vendor lock-in'
  point_2: 'Deploys in minutes with Docker'
  point_3: 'Full control over your participants’ data'
  action: 'View on GitHub'
  terminal_comment: 'on your own server'
  terminal_done: '@:app_name is running'
cta:
  title: 'Ready for a calmer event season?'
  text: 'Set up your first event in minutes and share the link the same day.'
  participant_hint: 'Just want to sign up for an event?'
  participant_link: 'Find your event here'
</i18n>

<i18n lang="yaml" locale="de">
meta_title: 'Veranstaltungsverwaltung einfach gemacht'
meta_description: '@:app_name ist eine Open-Source-Plattform für die Organisation von Veranstaltungen: Online-Anmeldeformulare, Teilnehmendenlisten, Zimmer- und Programmplanung, automatische E-Mails und Newsletter.'
fasttrack:
  title: 'Du willst dich für eine Veranstaltung anmelden?'
  text: 'Alle Veranstaltungen, für die die Anmeldung offen ist, in einer Liste.'
  point_1: 'Kein Konto, kein Passwort'
  point_2: 'Ein paar Minuten am Handy'
  point_3: 'In deiner eigenen Sprache'
  action: 'Veranstaltung finden'
hero:
  eyebrow: 'Open-Source-Veranstaltungsverwaltung'
  title: 'Organisiere deine Veranstaltung,'
  title_highlight: 'nicht deinen Papierkram'
  subtitle: '@:app_name vereint Anmeldungen, Teilnehmende, Zimmer, Programm und Kommunikation an einem Ort — von Veranstaltungsorganisatoren für Veranstaltungsorganisatoren entwickelt.'
  proof_label: 'Was dir @:app_name bietet'
  proof:
    open_source: 'Open Source, AGPLv3'
    self_host: 'Selbst hostbar'
    languages: 'Fünf Sprachen'
    no_account: 'Anmeldung ohne Konto'
organizers:
  action: 'Jetzt starten'
  action_authed: 'Zur Verwaltung'
  action_login: 'Anmelden'
step:
  title: 'So funktioniert es'
  subtitle: 'Zwei kurze Wege — einer für die, die die Veranstaltung machen, einer für die, die mitfahren.'
  organizer:
    title: 'Wenn du organisierst'
    one:
      title: 'Veranstaltung anlegen'
      text: 'Termine, Kapazität und Altersspanne festlegen, dann das Anmeldeformular bauen.'
    two:
      title: 'Link teilen'
      text: 'Die Anmeldungen landen in deiner Liste, und die Bestätigungsmail geht von selbst raus.'
    three:
      title: 'Veranstaltung durchführen'
      text: 'Zimmer verteilen, Programm und Dienste planen und alle auf dem Laufenden halten.'
  participant:
    title: 'Wenn du dich anmeldest'
    one:
      title: 'Veranstaltung finden'
      text: 'Sieh dir die offenen Veranstaltungen an oder öffne den Link der Organisatoren.'
    two:
      title: 'Formular ausfüllen'
      text: 'Ein paar Minuten auf jedem Gerät, in deiner Sprache — ganz ohne Konto.'
    three:
      title: 'Bestätigung erhalten'
      text: 'Eine E-Mail bestätigt deinen Platz, mit allen Details und den Datenschutzhinweisen.'
selfhost:
  eyebrow: 'Open Source · AGPLv3'
  title: 'Deine Veranstaltung, deine Daten — auf Wunsch dein Server'
  text: '@:app_name ist vollständig Open Source. Nutze es direkt hier oder hoste die gesamte Plattform auf deiner eigenen Infrastruktur — Teilnehmerdaten bleiben so komplett in deiner Hand.'
  point_1: 'AGPLv3-lizenziert, kein Vendor-Lock-in'
  point_2: 'In Minuten mit Docker installiert'
  point_3: 'Volle Kontrolle über die Daten deiner Teilnehmenden'
  action: 'Auf GitHub ansehen'
  terminal_comment: 'auf deinem eigenen Server'
  terminal_done: '@:app_name läuft'
cta:
  title: 'Bereit für eine entspanntere Veranstaltungssaison?'
  text: 'Richte deine erste Veranstaltung in wenigen Minuten ein und teile den Link noch am selben Tag.'
  participant_hint: 'Du möchtest dich nur für eine Veranstaltung anmelden?'
  participant_link: 'Hier findest du deine Veranstaltung'
</i18n>

<i18n lang="yaml" locale="fr">
meta_title: "La gestion d'événements simplifiée"
meta_description: '@:app_name est une plateforme open source pour organiser des événements : formulaires d’inscription en ligne, listes de participants, planification des chambres et du programme, e-mails automatiques et infolettres.'
fasttrack:
  title: 'Vous venez vous inscrire à un événement ?'
  text: 'Tous les événements actuellement ouverts aux inscriptions, en une liste.'
  point_1: 'Ni compte, ni mot de passe'
  point_2: 'Quelques minutes sur votre téléphone'
  point_3: 'Dans votre propre langue'
  action: 'Trouver votre événement'
hero:
  eyebrow: "Gestion d'événements open source"
  title: 'Organisez votre événement,'
  title_highlight: 'pas votre paperasse'
  subtitle: "@:app_name réunit inscriptions, participants, chambres, programme et communication en un seul endroit — conçu par des organisateurs d'événements, pour des organisateurs d'événements."
  proof_label: 'Ce que vous apporte @:app_name'
  proof:
    open_source: 'Open source, AGPLv3'
    self_host: 'Auto-hébergeable'
    languages: 'Cinq langues'
    no_account: 'Inscription sans compte'
organizers:
  action: 'Commencer'
  action_authed: 'Accéder à la gestion'
  action_login: 'Se connecter'
step:
  title: 'Comment ça marche'
  subtitle: "Deux parcours courts — un pour celles et ceux qui organisent, un pour celles et ceux qui s'inscrivent."
  organizer:
    title: 'Si vous organisez'
    one:
      title: 'Créez votre événement'
      text: "Fixez les dates, la capacité et la tranche d'âge, puis créez votre formulaire."
    two:
      title: 'Partagez votre lien'
      text: "Les inscriptions arrivent dans votre liste et l'e-mail de confirmation part tout seul."
    three:
      title: "Menez l'événement"
      text: 'Répartissez les chambres, planifiez le programme et les services, informez tout le monde.'
  participant:
    title: 'Si vous vous inscrivez'
    one:
      title: 'Trouvez votre événement'
      text: "Parcourez les événements ouverts, ou ouvrez le lien envoyé par l'organisateur."
    two:
      title: 'Remplissez le formulaire'
      text: 'Quelques minutes sur tout appareil, dans votre langue — sans créer de compte.'
    three:
      title: 'Recevez votre confirmation'
      text: 'Un e-mail confirme votre place, avec les détails et les informations de confidentialité.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Votre événement, vos données — votre serveur si vous le souhaitez'
  text: '@:app_name est entièrement open source. Utilisez-le ici même, ou hébergez la plateforme complète sur votre propre infrastructure — les données des participants restent entre vos mains.'
  point_1: 'Sous licence AGPLv3, sans dépendance à un fournisseur'
  point_2: 'Déployé en quelques minutes avec Docker'
  point_3: 'Contrôle total sur les données de vos participants'
  action: 'Voir sur GitHub'
  terminal_comment: 'sur votre propre serveur'
  terminal_done: '@:app_name est en ligne'
cta:
  title: "Prêt pour une saison d'événement plus sereine ?"
  text: 'Créez votre premier événement en quelques minutes et partagez le lien le jour même.'
  participant_hint: 'Vous souhaitez simplement vous inscrire à un événement ?'
  participant_link: 'Trouvez votre événement ici'
</i18n>

<i18n lang="yaml" locale="pl">
meta_title: 'Proste zarządzanie wydarzeniami'
meta_description: '@:app_name to platforma open source do organizacji wydarzeń: internetowe formularze zapisów, listy uczestników, planowanie pokoi i programu, automatyczne e-maile i newslettery.'
fasttrack:
  title: 'Chcesz zapisać się na wydarzenie?'
  text: 'Wszystkie wydarzenia z otwartymi zapisami na jednej liście.'
  point_1: 'Bez konta i bez hasła'
  point_2: 'Kilka minut na telefonie'
  point_3: 'W Twoim własnym języku'
  action: 'Znajdź wydarzenie'
hero:
  eyebrow: 'Zarządzanie wydarzeniami open source'
  title: 'Organizuj wydarzenie,'
  title_highlight: 'nie papierkową robotę'
  subtitle: '@:app_name łączy rejestracje, uczestników, pokoje, program i komunikację w jednym miejscu — stworzona przez organizatorów wydarzeń dla organizatorów wydarzeń.'
  proof_label: 'Co daje Ci @:app_name'
  proof:
    open_source: 'Open source, AGPLv3'
    self_host: 'Własny hosting'
    languages: 'Pięć języków'
    no_account: 'Zapisy bez konta'
organizers:
  action: 'Zacznij teraz'
  action_authed: 'Przejdź do zarządzania'
  action_login: 'Zaloguj się'
step:
  title: 'Jak to działa'
  subtitle: 'Dwie krótkie ścieżki — jedna dla organizujących, druga dla zapisujących się.'
  organizer:
    title: 'Jeśli organizujesz'
    one:
      title: 'Utwórz wydarzenie'
      text: 'Ustal terminy, liczbę miejsc i przedział wieku, a potem zbuduj formularz zapisów.'
    two:
      title: 'Udostępnij link'
      text: 'Zgłoszenia trafiają na Twoją listę, a e-mail z potwierdzeniem wychodzi sam.'
    three:
      title: 'Poprowadź wydarzenie'
      text: 'Przydziel pokoje, zaplanuj program i dyżury, informuj wszystkich na bieżąco.'
  participant:
    title: 'Jeśli się zapisujesz'
    one:
      title: 'Znajdź wydarzenie'
      text: 'Przejrzyj otwarte wydarzenia albo otwórz link od organizatora.'
    two:
      title: 'Wypełnij formularz'
      text: 'Kilka minut na dowolnym urządzeniu, w Twoim języku — bez zakładania konta.'
    three:
      title: 'Odbierz potwierdzenie'
      text: 'E-mail potwierdza Twoje miejsce, ze szczegółami i informacją o prywatności.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Twoje wydarzenie, Twoje dane — i Twój serwer, jeśli chcesz'
  text: '@:app_name jest w pełni otwartym oprogramowaniem. Korzystaj z niej tutaj albo hostuj całą platformę na własnej infrastrukturze — dane uczestników pozostają w Twoich rękach.'
  point_1: 'Licencja AGPLv3, bez uzależnienia od dostawcy'
  point_2: 'Wdrożenie w kilka minut dzięki Dockerowi'
  point_3: 'Pełna kontrola nad danymi uczestników'
  action: 'Zobacz na GitHubie'
  terminal_comment: 'na Twoim własnym serwerze'
  terminal_done: '@:app_name działa'
cta:
  title: 'Gotowi na spokojniejszy sezon wydarzeń?'
  text: 'Przygotuj pierwsze wydarzenie w kilka minut i udostępnij link jeszcze tego samego dnia.'
  participant_hint: 'Chcesz tylko zapisać się na wydarzenie?'
  participant_link: 'Znajdź swoje wydarzenie tutaj'
</i18n>

<i18n lang="yaml" locale="cs">
meta_title: 'Jednoduchá správa akcí'
meta_description: '@:app_name je open-source platforma pro organizaci akcí: online registrační formuláře, seznamy účastníků, plánování pokojů a programu, automatické e-maily a newslettery.'
fasttrack:
  title: 'Chcete se přihlásit na akci?'
  text: 'Všechny akce s otevřenou registrací v jednom seznamu.'
  point_1: 'Bez účtu a bez hesla'
  point_2: 'Pár minut na mobilu'
  point_3: 'Ve vašem vlastním jazyce'
  action: 'Najít akci'
hero:
  eyebrow: 'Open-source správa akcí'
  title: 'Organizujte akci,'
  title_highlight: 'ne papírování'
  subtitle: '@:app_name spojuje registrace, účastníky, pokoje, program a komunikaci na jednom místě — vytvořena organizátory akcí pro organizátory akcí.'
  proof_label: 'Co vám @:app_name přináší'
  proof:
    open_source: 'Open source, AGPLv3'
    self_host: 'Vlastní hosting'
    languages: 'Pět jazyků'
    no_account: 'Registrace bez účtu'
organizers:
  action: 'Začít'
  action_authed: 'Přejít do správy'
  action_login: 'Přihlásit se'
step:
  title: 'Jak to funguje'
  subtitle: 'Dvě krátké cesty — jedna pro ty, kdo akci pořádají, druhá pro ty, kdo se na ni hlásí.'
  organizer:
    title: 'Když pořádáte'
    one:
      title: 'Založte akci'
      text: 'Nastavte termíny, kapacitu a věkové rozmezí a pak sestavte registrační formulář.'
    two:
      title: 'Sdílejte odkaz'
      text: 'Registrace přistávají ve vašem seznamu a potvrzovací e-mail odejde sám.'
    three:
      title: 'Veďte akci'
      text: 'Rozdělte pokoje, naplánujte program i služby a udržujte všechny v obraze.'
  participant:
    title: 'Když se hlásíte'
    one:
      title: 'Najděte svou akci'
      text: 'Projděte otevřené akce, nebo otevřete odkaz od organizátorů.'
    two:
      title: 'Vyplňte formulář'
      text: 'Pár minut na jakémkoli zařízení a ve vašem jazyce — bez zakládání účtu.'
    three:
      title: 'Dostanete potvrzení'
      text: 'E-mail potvrdí vaše místo, i s podrobnostmi a informacemi o soukromí.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Vaše akce, vaše data — a klidně i váš server'
  text: '@:app_name je plně open source. Používejte ji přímo zde, nebo si celou platformu provozujte na vlastní infrastruktuře — data účastníků zůstanou ve vašich rukou.'
  point_1: 'Licence AGPLv3 bez závislosti na dodavateli'
  point_2: 'Nasazení během několika minut s Dockerem'
  point_3: 'Plná kontrola nad daty účastníků'
  action: 'Zobrazit na GitHubu'
  terminal_comment: 'na vašem vlastním serveru'
  terminal_done: '@:app_name běží'
cta:
  title: 'Připraveni na klidnější sezónu akcí?'
  text: 'Připravte svou první akci během několika minut a sdílejte odkaz ještě týž den.'
  participant_hint: 'Chcete se jen přihlásit na akci?'
  participant_link: 'Svou akci najdete tady'
</i18n>
