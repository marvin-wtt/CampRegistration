<template>
  <q-page class="landing">
    <!-- ====================================================== HERO -->
    <section class="landing__section hero">
      <div class="hero__glow" />

      <div class="hero__eyebrow anim anim--1">
        <q-icon
          name="cabin"
          size="16px"
        />
        <span>{{ t('hero.eyebrow') }}</span>
      </div>

      <h1 class="hero__title anim anim--2">
        {{ t('hero.title') }}
        <br />
        <span class="hero__highlight">{{ t('hero.title_highlight') }}</span>
      </h1>

      <p class="hero__subtitle anim anim--3">
        {{ t('hero.subtitle') }}
      </p>

      <!-- Audience split: organizers dominant, participants get a fast exit -->
      <div class="hero__split anim anim--4">
        <article class="split-card split-card--organizers">
          <span class="split-card__badge">{{ t('organizers.badge') }}</span>
          <h2 class="split-card__title">{{ t('organizers.title') }}</h2>
          <p class="split-card__text">{{ t('organizers.text') }}</p>
          <div class="split-card__actions">
            <m-btn
              :label="organizerCtaLabel"
              :to="organizerCtaTo"
              icon-right="arrow_forward"
              size="16px"
              no-caps
              data-cy="landing-organizer-cta"
            />
            <m-btn
              v-if="!user"
              :label="t('organizers.action_login')"
              :to="{ name: 'login' }"
              text
              size="16px"
              no-caps
              data-cy="landing-login"
            />
          </div>
        </article>

        <article class="split-card split-card--participants">
          <q-icon
            class="split-card__icon"
            name="hiking"
            size="32px"
          />
          <h2 class="split-card__title">{{ t('participants.title') }}</h2>
          <p class="split-card__text">{{ t('participants.text') }}</p>
          <div class="split-card__actions">
            <m-btn
              :label="t('participants.action')"
              :to="{ name: 'camps' }"
              tonal
              tertiary
              icon-right="arrow_forward"
              no-caps
              data-cy="landing-participant-cta"
            />
          </div>
        </article>
      </div>
    </section>

    <!-- ================================================== FEATURES -->
    <section class="landing__section features">
      <h2 class="section-title">{{ t('feature.title') }}</h2>
      <p class="section-subtitle">{{ t('feature.subtitle') }}</p>

      <div class="features__grid">
        <article
          v-for="feature in features"
          :key="feature.name"
          class="feature-card"
        >
          <div class="feature-card__icon">
            <q-icon
              :name="feature.icon"
              size="26px"
            />
          </div>
          <h3 class="feature-card__title">
            {{ t(`feature.${feature.name}.title`) }}
          </h3>
          <p class="feature-card__text">
            {{ t(`feature.${feature.name}.text`) }}
          </p>
        </article>
      </div>

      <div class="features__more">
        <span class="features__more-label">{{ t('feature.more_label') }}</span>
        <span
          v-for="chip in extraChips"
          :key="chip.name"
          class="features__chip"
        >
          <q-icon
            :name="chip.icon"
            size="16px"
          />
          {{ t(`feature.chip.${chip.name}`) }}
        </span>
      </div>
    </section>

    <!-- ===================================================== STEPS -->
    <section class="landing__section steps">
      <h2 class="section-title">{{ t('step.title') }}</h2>

      <ol class="steps__list">
        <li
          v-for="(step, index) in ['one', 'two', 'three']"
          :key="step"
          class="step"
        >
          <span
            class="step__number"
            aria-hidden="true"
          >
            {{ index + 1 }}
          </span>
          <h3 class="step__title">{{ t(`step.${step}.title`) }}</h3>
          <p class="step__text">{{ t(`step.${step}.text`) }}</p>
        </li>
      </ol>
    </section>

    <!-- ================================================= SELF-HOST -->
    <section class="landing__section selfhost">
      <div class="selfhost__card">
        <div class="selfhost__content">
          <span class="selfhost__eyebrow">{{ t('selfhost.eyebrow') }}</span>
          <h2 class="selfhost__title">{{ t('selfhost.title') }}</h2>
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
            href="https://github.com/marvin-wtt/CampRegistration"
            target="_blank"
            rel="noopener"
            tonal
            icon="code"
            icon-right="open_in_new"
            no-caps
            data-cy="landing-github"
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
          <pre class="selfhost__terminal-body">
            <span class="t-dim"># {{ t('selfhost.terminal_comment') }}</span>
<span class="t-prompt">$</span> git clone marvin-wtt/CampRegistration
<span class="t-prompt">$</span> docker compose up -d
<span class="t-ok">✓</span> {{ t('selfhost.terminal_done') }}</pre>
        </div>
      </div>
    </section>

    <!-- ======================================================= CTA -->
    <section class="landing__section cta">
      <div class="cta__card">
        <h2 class="cta__title">{{ t('cta.title') }}</h2>
        <p class="cta__text">{{ t('cta.text') }}</p>
        <m-btn
          :label="organizerCtaLabel"
          :to="organizerCtaTo"
          elevated
          icon-right="arrow_forward"
          size="16px"
          class="cta__btn"
          no-caps
          data-cy="landing-bottom-cta"
        />
        <p class="cta__hint">
          {{ t('cta.participant_hint') }}
          <router-link :to="{ name: 'camps' }">
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
import { useProfileStore } from 'stores/profile-store';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();
const profileStore = useProfileStore();
const { user } = storeToRefs(profileStore);

useMeta(() => ({
  title: t('meta_title'),
}));

const organizerCtaLabel = computed<string>(() =>
  user.value ? t('organizers.action_authed') : t('organizers.action'),
);

const organizerCtaTo = computed(() =>
  user.value ? { name: 'management' } : { name: 'register' },
);

const features = [
  { name: 'forms', icon: 'dynamic_form' },
  { name: 'participants', icon: 'table_view' },
  { name: 'messaging', icon: 'forward_to_inbox' },
  { name: 'program', icon: 'calendar_month' },
  { name: 'rooms', icon: 'bed' },
  { name: 'contacts', icon: 'contact_mail' },
  { name: 'team', icon: 'group_add' },
  { name: 'dashboard', icon: 'dashboard' },
  { name: 'newsletter', icon: 'campaign' },
] as const;

const extraChips = [
  { name: 'responsive', icon: 'devices' },
  { name: 'languages', icon: 'translate' },
  { name: 'multilingual_forms', icon: 'language' },
  { name: 'files', icon: 'attach_file' },
  { name: 'templates', icon: 'drafts' },
  { name: 'two_factor', icon: 'phonelink_lock' },
  { name: 'dark_mode', icon: 'dark_mode' },
] as const;
</script>

<style lang="scss" scoped>
/*
 * Built entirely on the MD3 design tokens (--md3-*) exposed by
 * @anoyomoose/q2-fresh-paint-md3e, so light and dark themes both work
 * without manual overrides.
 */
.landing {
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

/* Audience split cards */
.hero__split {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 20px;
  margin-top: clamp(32px, 6vh, 56px);
}

.split-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: clamp(24px, 3.5vw, 40px);
}

.split-card__title {
  margin: 0;
  font-size: clamp(1.35rem, 2.4vw, 1.8rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.split-card__text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.55;
}

.split-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
}

/* Organizers: the dominant card — MD3 expressive asymmetric corners */
.split-card--organizers {
  border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
    var(--md3-corner-extra-large) 72px;
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.split-card__badge {
  padding: 4px 12px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: var(--md3-corner-full);
  color: var(--md3-primary-container);
  background: var(--md3-on-primary-container);
}

/* Participants: lighter, clearly secondary but impossible to miss */
.split-card--participants {
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
    72px var(--md3-corner-extra-large);
  color: var(--md3-on-surface);
  background: var(--md3-surface-container-low);
}

.split-card--participants .split-card__text {
  color: var(--md3-on-surface-variant);
}

.split-card__icon {
  padding: 10px;
  border-radius: var(--md3-corner-large);
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
  box-sizing: content-box;
}

/* ====================================================== FEATURES */
.features {
  padding-top: clamp(56px, 10vh, 104px);
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.feature-card {
  padding: 24px;
  border-radius: var(--md3-corner-extra-large);
  background: var(--md3-surface-container);
  transition:
    border-radius 0.35s var(--md3-easing-emphasized),
    background-color 0.35s var(--md3-easing-emphasized),
    transform 0.35s var(--md3-easing-emphasized);
}

.feature-card:hover {
  border-radius: var(--md3-corner-extra-large) 48px
    var(--md3-corner-extra-large) 48px;
  background: var(--md3-surface-container-high);
  transform: translateY(-3px);
}

.feature-card__icon {
  display: inline-flex;
  padding: 12px;
  border-radius: var(--md3-corner-large);
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
}

/* Alternate icon tints so the grid doesn't look stamped out */
.feature-card:nth-child(3n + 2) .feature-card__icon {
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.feature-card:nth-child(3n) .feature-card__icon {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

.feature-card__title {
  margin: 16px 0 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--md3-on-surface);
}

.feature-card__text {
  margin: 8px 0 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--md3-on-surface-variant);
}

.features__more {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
}

.features__more-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--md3-on-surface-variant);
}

.features__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 0.82rem;
  font-weight: 500;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-full);
  color: var(--md3-on-surface-variant);
}

/* ========================================================= STEPS */
.steps {
  padding-top: clamp(56px, 10vh, 104px);
}

.steps__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
}

.step {
  position: relative;
  padding: 88px 20px 24px 24px;
  border-radius: var(--md3-corner-extra-large);
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

.step__number {
  position: absolute;
  top: -28px;
  left: 4px;
  font-size: 7rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;
  color: rgba(var(--md3-primary-rgb), 0.14);
  user-select: none;
}

.step__title {
  position: relative;
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--md3-on-surface);
}

.step__text {
  position: relative;
  margin: 8px 0 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--md3-on-surface-variant);
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
    animation-delay: 0.4s;
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
  .features__grid,
  .steps__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

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

  .hero__split {
    grid-template-columns: minmax(0, 1fr);
  }

  .features__grid,
  .steps__list {
    grid-template-columns: minmax(0, 1fr);
  }

  .split-card--organizers {
    border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
      var(--md3-corner-extra-large) 48px;
  }

  .split-card--participants {
    border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
      48px var(--md3-corner-extra-large);
  }
}
</style>

<i18n lang="yaml" locale="en">
meta_title: 'Camp management made simple'
hero:
  eyebrow: 'Free & open-source camp management'
  title: 'Run your camp,'
  title_highlight: 'not your paperwork'
  subtitle: '@:app_name brings registrations, participants, rooms, program, and communication together in one place — built by camp organizers, for camp organizers.'
participants:
  title: 'Joining a camp?'
  text: 'Find your camp and register online in a few minutes — no account required.'
  action: 'Browse open camps'
organizers:
  badge: 'For organizers'
  title: 'Everything your camp team needs'
  text: 'From the first registration form to the final room plan — manage the entire camp together with your team.'
  action: 'Get started for free'
  action_authed: 'Open management'
  action_login: 'Sign in'
feature:
  title: 'Why organize with @:app_name?'
  subtitle: "Because spreadsheets, paper forms, and email chains don't scale to a whole camp."
  forms:
    title: 'Dynamic registration forms'
    text: 'Build multi-page forms with conditional logic, dynamic inputs, file uploads, and built-in translations. Families register online in minutes.'
  participants:
    title: 'Tables built around your data'
    text: 'Arrange registrations into custom tables that show exactly what you need — then filter, export, or print them.'
  messaging:
    title: 'Emails that send themselves'
    text: 'Send personalized, fully customizable confirmation, acceptance, and cancellation emails automatically — no manual work required.'
  rooms:
    title: 'Room planner'
    text: 'Assign participants to rooms while keeping beds, ages, and groups in view.'
  program:
    title: 'Program planner'
    text: 'Plan the camp schedule collaboratively — from arrival day to departure, visible to the whole team.'
  contacts:
    title: 'Email participants directly'
    text: 'Reach a single participant or a whole group with personalized emails — sent to exactly the right people.'
  newsletter:
    title: 'Newsletters'
    text: 'Keep families in the loop with newsletters sent straight to everyone who signed up.'
  dashboard:
    title: 'Dashboard overview'
    text: 'See capacity, registrations, and key numbers at a glance — your whole camp on one screen.'
  team:
    title: 'Share access with your team'
    text: 'Invite counselors and coordinators with fine-grained roles and permissions, and manage the camp together.'
  more_label: 'Also included:'
  chip:
    responsive: 'Works on desktop & mobile'
    languages: 'Five languages'
    multilingual_forms: 'Multilingual forms'
    files: 'File management'
    templates: 'Email templates'
    two_factor: 'Two-factor authentication'
    dark_mode: 'Dark mode'
step:
  title: 'Up and running in an afternoon'
  one:
    title: 'Create your camp'
    text: 'Set dates and capacity, and build your registration form.'
  two:
    title: 'Share your link'
    text: 'Families register online — every registration appears instantly.'
  three:
    title: 'Run the camp'
    text: 'Assign rooms, plan the program, and keep everyone informed.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Your camp, your data — your server, if you want'
  text: '@:app_name is fully open source. Use it right here, or self-host the entire platform on your own infrastructure — so participant data never leaves your hands.'
  point_1: 'AGPLv3-licensed with no vendor lock-in'
  point_2: 'Deploys in minutes with Docker'
  point_3: 'Full control over your participants’ data'
  action: 'View on GitHub'
  terminal_comment: 'on your own server'
  terminal_done: '@:app_name is running'
cta:
  title: 'Ready for a calmer camp season?'
  text: 'Create your first camp in minutes — free of charge.'
  participant_hint: 'Just want to sign up for a camp?'
  participant_link: 'Find your camp here'
</i18n>

<i18n lang="yaml" locale="de">
meta_title: 'Camp-Verwaltung einfach gemacht'
hero:
  eyebrow: 'Kostenlose Open-Source-Camp-Verwaltung'
  title: 'Organisiere dein Camp,'
  title_highlight: 'nicht deinen Papierkram'
  subtitle: '@:app_name vereint Anmeldungen, Teilnehmende, Zimmer, Programm und Kommunikation an einem Ort — von Camp-Organisatoren für Camp-Organisatoren entwickelt.'
participants:
  title: 'Du möchtest an einem Camp teilnehmen?'
  text: 'Finde dein Camp und melde dich in wenigen Minuten online an — ganz ohne Konto.'
  action: 'Offene Camps ansehen'
organizers:
  badge: 'Für Organisatoren'
  title: 'Alles, was dein Camp-Team braucht'
  text: 'Vom ersten Anmeldeformular bis zum fertigen Zimmerplan — verwalte das gesamte Camp gemeinsam mit deinem Team.'
  action: 'Kostenlos starten'
  action_authed: 'Zur Verwaltung'
  action_login: 'Anmelden'
feature:
  title: 'Warum mit @:app_name organisieren?'
  subtitle: 'Weil Tabellen, Papierformulare und E-Mail-Ketten bei einem ganzen Camp an ihre Grenzen kommen.'
  forms:
    title: 'Dynamische Anmeldeformulare'
    text: 'Erstelle mehrseitige Formulare mit bedingter Logik, dynamischen Feldern, Datei-Uploads und integrierten Übersetzungen. Familien melden sich in Minuten online an.'
  participants:
    title: 'Tabellen nach deinen Daten'
    text: 'Ordne Anmeldungen in individuellen Tabellen, die genau das zeigen, was du brauchst — filtere, exportiere oder drucke sie.'
  messaging:
    title: 'E-Mails, die sich selbst versenden'
    text: 'Versende personalisierte, frei anpassbare Bestätigungs-, Zusage- und Stornierungs-E-Mails automatisch — ganz ohne manuellen Aufwand.'
  rooms:
    title: 'Zimmerplaner'
    text: 'Weise Teilnehmende Zimmern zu und behalte Betten, Alter und Gruppen im Blick.'
  program:
    title: 'Programmplaner'
    text: 'Plant den Camp-Ablauf gemeinsam — vom Anreisetag bis zur Abreise, sichtbar für das ganze Team.'
  contacts:
    title: 'Teilnehmende direkt anschreiben'
    text: 'Erreiche eine einzelne Person oder eine ganze Gruppe mit personalisierten E-Mails — gesendet an genau die richtigen Empfänger.'
  newsletter:
    title: 'Newsletter'
    text: 'Halte Familien mit Newslettern auf dem Laufenden, die direkt an alle Angemeldeten gehen.'
  dashboard:
    title: 'Dashboard-Überblick'
    text: 'Sieh Kapazität, Anmeldungen und wichtige Zahlen auf einen Blick — dein ganzes Camp auf einem Bildschirm.'
  team:
    title: 'Zugriff mit deinem Team teilen'
    text: 'Lade Betreuer und Koordinatoren mit fein abgestuften Rollen und Berechtigungen ein und verwaltet das Camp gemeinsam.'
  more_label: 'Außerdem enthalten:'
  chip:
    responsive: 'Läuft auf Desktop & Smartphone'
    languages: 'Fünf Sprachen'
    multilingual_forms: 'Mehrsprachige Formulare'
    files: 'Dateiverwaltung'
    templates: 'E-Mail-Vorlagen'
    two_factor: 'Zwei-Faktor-Authentifizierung'
    dark_mode: 'Dark Mode'
step:
  title: 'An einem Nachmittag startklar'
  one:
    title: 'Erstelle dein Camp'
    text: 'Lege Termine und Kapazität fest und baue dein Anmeldeformular.'
  two:
    title: 'Teile deinen Link'
    text: 'Familien melden sich online an — jede Anmeldung erscheint sofort.'
  three:
    title: 'Führe das Camp durch'
    text: 'Plane Zimmer und Programm und halte alle auf dem Laufenden.'
selfhost:
  eyebrow: 'Open Source · AGPLv3'
  title: 'Dein Camp, deine Daten — auf Wunsch dein Server'
  text: '@:app_name ist vollständig Open Source. Nutze es direkt hier oder hoste die gesamte Plattform auf deiner eigenen Infrastruktur — Teilnehmerdaten bleiben so komplett in deiner Hand.'
  point_1: 'AGPLv3-lizenziert, kein Vendor-Lock-in'
  point_2: 'In Minuten mit Docker installiert'
  point_3: 'Volle Kontrolle über die Daten deiner Teilnehmenden'
  action: 'Auf GitHub ansehen'
  terminal_comment: 'auf deinem eigenen Server'
  terminal_done: '@:app_name läuft'
cta:
  title: 'Bereit für eine entspanntere Camp-Saison?'
  text: 'Erstelle dein erstes Camp in wenigen Minuten — völlig kostenlos.'
  participant_hint: 'Du möchtest dich nur für ein Camp anmelden?'
  participant_link: 'Hier findest du dein Camp'
</i18n>

<i18n lang="yaml" locale="fr">
meta_title: 'La gestion de camps simplifiée'
hero:
  eyebrow: 'Gestion de camps gratuite et open source'
  title: 'Organisez votre camp,'
  title_highlight: 'pas votre paperasse'
  subtitle: '@:app_name réunit inscriptions, participants, chambres, programme et communication en un seul endroit — conçu par des organisateurs de camps, pour des organisateurs de camps.'
participants:
  title: 'Vous participez à un camp ?'
  text: 'Trouvez votre camp et inscrivez-vous en ligne en quelques minutes — sans créer de compte.'
  action: 'Voir les camps ouverts'
organizers:
  badge: 'Pour les organisateurs'
  title: 'Tout ce dont votre équipe a besoin'
  text: "Du premier formulaire d'inscription au plan des chambres final — gérez l'ensemble du camp avec votre équipe."
  action: 'Commencer gratuitement'
  action_authed: 'Accéder à la gestion'
  action_login: 'Se connecter'
feature:
  title: 'Pourquoi organiser avec @:app_name ?'
  subtitle: "Parce que les tableurs, les formulaires papier et les chaînes d'e-mails ne suffisent plus pour tout un camp."
  forms:
    title: "Formulaires d'inscription dynamiques"
    text: "Créez des formulaires multi-pages avec logique conditionnelle, champs dynamiques, téléversement de fichiers et traductions intégrées. Les familles s'inscrivent en quelques minutes."
  participants:
    title: 'Des tableaux pensés pour vos données'
    text: 'Organisez les inscriptions dans des tableaux personnalisés qui montrent exactement ce dont vous avez besoin — filtrez, exportez ou imprimez.'
  messaging:
    title: 'Des e-mails qui partent tout seuls'
    text: "Envoyez automatiquement des e-mails de confirmation, d'acceptation et d'annulation personnalisés et entièrement personnalisables — sans aucune action manuelle."
  rooms:
    title: 'Planificateur de chambres'
    text: 'Affectez les participants aux chambres en gardant lits, âges et groupes sous les yeux.'
  program:
    title: 'Planificateur de programme'
    text: "Planifiez le déroulement du camp ensemble — du jour d'arrivée au départ, visible par toute l'équipe."
  contacts:
    title: 'Écrivez directement aux participants'
    text: 'Contactez un seul participant ou tout un groupe avec des e-mails personnalisés — envoyés exactement aux bonnes personnes.'
  newsletter:
    title: 'Infolettres'
    text: 'Tenez les familles informées avec des infolettres envoyées directement à toutes les personnes inscrites.'
  dashboard:
    title: 'Tableau de bord'
    text: "Visualisez capacité, inscriptions et chiffres clés en un coup d'œil — tout votre camp sur un seul écran."
  team:
    title: "Partagez l'accès avec votre équipe"
    text: 'Invitez animateurs et coordinateurs avec des rôles et permissions précis, et gérez le camp ensemble.'
  more_label: 'Également inclus :'
  chip:
    responsive: 'Fonctionne sur ordinateur et mobile'
    languages: 'Cinq langues'
    multilingual_forms: 'Formulaires multilingues'
    files: 'Gestion des fichiers'
    templates: "Modèles d'e-mails"
    two_factor: 'Authentification à deux facteurs'
    dark_mode: 'Mode sombre'
step:
  title: 'Opérationnel en un après-midi'
  one:
    title: 'Créez votre camp'
    text: "Définissez les dates et la capacité, puis créez votre formulaire d'inscription."
  two:
    title: 'Partagez votre lien'
    text: "Les familles s'inscrivent en ligne — chaque inscription apparaît instantanément."
  three:
    title: 'Gérez le camp'
    text: 'Répartissez les chambres, planifiez le programme et tenez tout le monde informé.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Votre camp, vos données — votre serveur si vous le souhaitez'
  text: '@:app_name est entièrement open source. Utilisez-le ici même, ou hébergez la plateforme complète sur votre propre infrastructure — les données des participants restent entre vos mains.'
  point_1: 'Sous licence AGPLv3, sans dépendance à un fournisseur'
  point_2: 'Déployé en quelques minutes avec Docker'
  point_3: 'Contrôle total sur les données de vos participants'
  action: 'Voir sur GitHub'
  terminal_comment: 'sur votre propre serveur'
  terminal_done: '@:app_name est en ligne'
cta:
  title: 'Prêt pour une saison de camp plus sereine ?'
  text: 'Créez votre premier camp en quelques minutes — gratuitement.'
  participant_hint: 'Vous souhaitez simplement vous inscrire à un camp ?'
  participant_link: 'Trouvez votre camp ici'
</i18n>

<i18n lang="yaml" locale="pl">
meta_title: 'Proste zarządzanie obozami'
hero:
  eyebrow: 'Darmowe zarządzanie obozami, open source'
  title: 'Organizuj obóz,'
  title_highlight: 'nie papierkową robotę'
  subtitle: '@:app_name łączy rejestracje, uczestników, pokoje, program i komunikację w jednym miejscu — stworzona przez organizatorów obozów dla organizatorów obozów.'
participants:
  title: 'Chcesz pojechać na obóz?'
  text: 'Znajdź swój obóz i zapisz się online w kilka minut — bez zakładania konta.'
  action: 'Przeglądaj otwarte obozy'
organizers:
  badge: 'Dla organizatorów'
  title: 'Wszystko, czego potrzebuje Twój zespół'
  text: 'Od pierwszego formularza rejestracyjnego po gotowy plan pokoi — zarządzaj całym obozem razem ze swoim zespołem.'
  action: 'Zacznij za darmo'
  action_authed: 'Przejdź do zarządzania'
  action_login: 'Zaloguj się'
feature:
  title: 'Dlaczego @:app_name?'
  subtitle: 'Bo arkusze kalkulacyjne, papierowe formularze i łańcuszki e-maili nie wystarczają na cały obóz.'
  forms:
    title: 'Dynamiczne formularze rejestracyjne'
    text: 'Twórz wielostronicowe formularze z logiką warunkową, dynamicznymi polami, przesyłaniem plików i wbudowanymi tłumaczeniami. Rodziny zapisują się w kilka minut.'
  participants:
    title: 'Tabele dopasowane do Twoich danych'
    text: 'Układaj rejestracje w niestandardowych tabelach pokazujących dokładnie to, czego potrzebujesz — filtruj, eksportuj lub drukuj.'
  messaging:
    title: 'E-maile, które wysyłają się same'
    text: 'Wysyłaj spersonalizowane, w pełni konfigurowalne e-maile z potwierdzeniem, akceptacją i anulowaniem automatycznie — bez ręcznej pracy.'
  rooms:
    title: 'Planer pokoi'
    text: 'Przypisuj uczestników do pokoi, mając na oku łóżka, wiek i grupy.'
  program:
    title: 'Planer programu'
    text: 'Planujcie przebieg obozu wspólnie — od dnia przyjazdu do wyjazdu, widoczny dla całego zespołu.'
  contacts:
    title: 'Pisz bezpośrednio do uczestników'
    text: 'Dotrzyj do pojedynczego uczestnika lub całej grupy spersonalizowanymi e-mailami — wysłanymi dokładnie do właściwych osób.'
  newsletter:
    title: 'Newsletter'
    text: 'Informuj rodziny dzięki newsletterom wysyłanym prosto do wszystkich zapisanych.'
  dashboard:
    title: 'Panel główny'
    text: 'Sprawdzaj liczbę miejsc, rejestracje i kluczowe dane jednym spojrzeniem — cały obóz na jednym ekranie.'
  team:
    title: 'Udostępnij dostęp zespołowi'
    text: 'Zapraszaj opiekunów i koordynatorów z precyzyjnymi rolami i uprawnieniami i zarządzajcie obozem wspólnie.'
  more_label: 'A do tego:'
  chip:
    responsive: 'Działa na komputerze i telefonie'
    languages: 'Pięć języków'
    multilingual_forms: 'Wielojęzyczne formularze'
    files: 'Zarządzanie plikami'
    templates: 'Szablony e-maili'
    two_factor: 'Uwierzytelnianie dwuskładnikowe'
    dark_mode: 'Tryb ciemny'
step:
  title: 'Gotowe w jedno popołudnie'
  one:
    title: 'Utwórz obóz'
    text: 'Ustal terminy i liczbę miejsc oraz zbuduj formularz rejestracyjny.'
  two:
    title: 'Udostępnij link'
    text: 'Rodziny zapisują się online — każda rejestracja pojawia się natychmiast.'
  three:
    title: 'Prowadź obóz'
    text: 'Przydzielaj pokoje, planuj program i informuj wszystkich na bieżąco.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Twój obóz, Twoje dane — i Twój serwer, jeśli chcesz'
  text: '@:app_name jest w pełni otwartym oprogramowaniem. Korzystaj z niej tutaj albo hostuj całą platformę na własnej infrastrukturze — dane uczestników pozostają w Twoich rękach.'
  point_1: 'Licencja AGPLv3, bez uzależnienia od dostawcy'
  point_2: 'Wdrożenie w kilka minut dzięki Dockerowi'
  point_3: 'Pełna kontrola nad danymi uczestników'
  action: 'Zobacz na GitHubie'
  terminal_comment: 'na Twoim własnym serwerze'
  terminal_done: '@:app_name działa'
cta:
  title: 'Gotowi na spokojniejszy sezon obozowy?'
  text: 'Utwórz swój pierwszy obóz w kilka minut — zupełnie za darmo.'
  participant_hint: 'Chcesz tylko zapisać się na obóz?'
  participant_link: 'Znajdź swój obóz tutaj'
</i18n>

<i18n lang="yaml" locale="cs">
meta_title: 'Jednoduchá správa táborů'
hero:
  eyebrow: 'Bezplatná open-source správa táborů'
  title: 'Organizujte tábor,'
  title_highlight: 'ne papírování'
  subtitle: '@:app_name spojuje registrace, účastníky, pokoje, program a komunikaci na jednom místě — vytvořena organizátory táborů pro organizátory táborů.'
participants:
  title: 'Chcete jet na tábor?'
  text: 'Najděte svůj tábor a přihlaste se online během několika minut — bez nutnosti účtu.'
  action: 'Procházet otevřené tábory'
organizers:
  badge: 'Pro organizátory'
  title: 'Vše, co váš táborový tým potřebuje'
  text: 'Od prvního registračního formuláře po hotový plán pokojů — spravujte celý tábor společně se svým týmem.'
  action: 'Začít zdarma'
  action_authed: 'Přejít do správy'
  action_login: 'Přihlásit se'
feature:
  title: 'Proč @:app_name?'
  subtitle: 'Protože tabulky, papírové formuláře a e-mailové řetězce na celý tábor nestačí.'
  forms:
    title: 'Dynamické registrační formuláře'
    text: 'Vytvářejte vícestránkové formuláře s podmíněnou logikou, dynamickými poli, nahráváním souborů a vestavěnými překlady. Rodiny se přihlásí během několika minut.'
  participants:
    title: 'Tabulky podle vašich dat'
    text: 'Uspořádejte registrace do vlastních tabulek, které ukazují přesně to, co potřebujete — filtrujte, exportujte nebo tiskněte.'
  messaging:
    title: 'E-maily, které se odešlou samy'
    text: 'Posílejte personalizované a plně přizpůsobitelné potvrzovací, schvalovací a stornovací e-maily automaticky — bez ruční práce.'
  rooms:
    title: 'Plánovač pokojů'
    text: 'Přiřazujte účastníky do pokojů a mějte přehled o lůžkách, věku a skupinách.'
  program:
    title: 'Plánovač programu'
    text: 'Plánujte průběh tábora společně — ode dne příjezdu až po odjezd, viditelné pro celý tým.'
  contacts:
    title: 'Pište účastníkům přímo'
    text: 'Oslovte jednotlivého účastníka nebo celou skupinu personalizovanými e-maily — odeslanými přesně těm správným lidem.'
  newsletter:
    title: 'Newsletter'
    text: 'Udržujte rodiny v obraze pomocí newsletterů odeslaných přímo všem přihlášeným.'
  dashboard:
    title: 'Přehledový panel'
    text: 'Sledujte kapacitu, registrace a klíčová čísla na jeden pohled — celý tábor na jedné obrazovce.'
  team:
    title: 'Sdílejte přístup se svým týmem'
    text: 'Zvěte vedoucí a koordinátory s jemně odstupňovanými rolemi a oprávněními a spravujte tábor společně.'
  more_label: 'A navíc:'
  chip:
    responsive: 'Funguje na počítači i mobilu'
    languages: 'Pět jazyků'
    multilingual_forms: 'Vícejazyčné formuláře'
    files: 'Správa souborů'
    templates: 'Šablony e-mailů'
    two_factor: 'Dvoufaktorové ověření'
    dark_mode: 'Tmavý režim'
step:
  title: 'Připraveno za jedno odpoledne'
  one:
    title: 'Vytvořte tábor'
    text: 'Nastavte termíny a kapacitu a sestavte registrační formulář.'
  two:
    title: 'Sdílejte odkaz'
    text: 'Rodiny se přihlašují online — každá registrace se objeví okamžitě.'
  three:
    title: 'Veďte tábor'
    text: 'Přidělujte pokoje, plánujte program a udržujte všechny v obraze.'
selfhost:
  eyebrow: 'Open source · AGPLv3'
  title: 'Váš tábor, vaše data — a klidně i váš server'
  text: '@:app_name je plně open source. Používejte ji přímo zde, nebo si celou platformu provozujte na vlastní infrastruktuře — data účastníků zůstanou ve vašich rukou.'
  point_1: 'Licence AGPLv3 bez závislosti na dodavateli'
  point_2: 'Nasazení během několika minut s Dockerem'
  point_3: 'Plná kontrola nad daty účastníků'
  action: 'Zobrazit na GitHubu'
  terminal_comment: 'na vašem vlastním serveru'
  terminal_done: '@:app_name běží'
cta:
  title: 'Připraveni na klidnější táborovou sezónu?'
  text: 'Vytvořte svůj první tábor během několika minut — zcela zdarma.'
  participant_hint: 'Chcete se jen přihlásit na tábor?'
  participant_link: 'Svůj tábor najdete tady'
</i18n>
