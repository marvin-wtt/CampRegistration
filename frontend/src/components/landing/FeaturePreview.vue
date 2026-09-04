<template>
  <svg
    class="preview"
    viewBox="0 0 320 200"
    role="img"
    :aria-label="label"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <clipPath :id="clipId">
        <rect
          x="0"
          y="0"
          width="320"
          height="200"
          rx="14"
        />
      </clipPath>
    </defs>

    <g :clip-path="`url(#${clipId})`">
      <rect
        width="320"
        height="200"
        fill="var(--md3-surface-container-lowest)"
      />
      <rect
        width="320"
        height="26"
        fill="var(--md3-surface-container-high)"
      />
      <circle
        v-for="(cx, i) in [14, 26, 38]"
        :key="cx"
        :cx="cx"
        cy="13"
        r="3.5"
        fill="var(--md3-on-surface-variant)"
        :opacity="0.22 + i * 0.06"
      />
      <rect
        x="56"
        y="9"
        width="120"
        height="8"
        rx="4"
        fill="var(--md3-outline-variant)"
      />

      <!-- ============================================== FORM BUILDER -->
      <g v-if="variant === 'form'">
        <rect
          x="16"
          y="40"
          width="288"
          height="6"
          rx="3"
          fill="var(--md3-surface-container-high)"
        />
        <rect
          x="16"
          y="40"
          width="168"
          height="6"
          rx="3"
          fill="var(--md3-primary)"
        />

        <g
          v-for="(col, i) in [16, 170]"
          :key="col"
        >
          <rect
            :x="col"
            y="60"
            :width="i === 0 ? 62 : 48"
            height="6"
            rx="3"
            fill="var(--md3-outline-variant)"
          />
          <rect
            :x="col"
            y="72"
            width="134"
            height="24"
            rx="9"
            fill="var(--md3-surface-container)"
            stroke="var(--md3-outline-variant)"
          />
        </g>

        <rect
          x="16"
          y="108"
          width="80"
          height="6"
          rx="3"
          fill="var(--md3-outline-variant)"
        />
        <rect
          x="16"
          y="120"
          width="288"
          height="24"
          rx="9"
          fill="var(--md3-surface-container)"
          stroke="var(--md3-outline-variant)"
        />

        <!-- a conditional field that just revealed itself -->
        <rect
          x="16"
          y="154"
          width="288"
          height="32"
          rx="11"
          fill="var(--md3-primary-container)"
        />
        <path
          d="M28 170h10m-5-5v10"
          stroke="var(--md3-on-primary-container)"
          stroke-width="2"
          stroke-linecap="round"
        />
        <rect
          x="48"
          y="167"
          width="118"
          height="6"
          rx="3"
          fill="var(--md3-on-primary-container)"
          opacity="0.55"
        />
        <rect
          x="248"
          y="162"
          width="44"
          height="16"
          rx="8"
          fill="var(--md3-on-primary-container)"
          opacity="0.18"
        />
      </g>

      <!-- =============================================== DATA TABLE -->
      <g v-else-if="variant === 'table'">
        <rect
          x="16"
          y="38"
          width="126"
          height="20"
          rx="10"
          fill="var(--md3-surface-container)"
          stroke="var(--md3-outline-variant)"
        />
        <circle
          cx="30"
          cy="47"
          r="4"
          fill="none"
          stroke="var(--md3-on-surface-variant)"
          stroke-width="1.6"
        />
        <path
          d="M33 50l3 3"
          stroke="var(--md3-on-surface-variant)"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <rect
          x="228"
          y="38"
          width="76"
          height="20"
          rx="10"
          fill="var(--md3-primary-container)"
        />

        <rect
          x="16"
          y="68"
          width="288"
          height="18"
          rx="6"
          fill="var(--md3-surface-container-high)"
        />
        <rect
          v-for="x in [26, 96, 166, 236]"
          :key="x"
          :x="x"
          y="74"
          width="42"
          height="6"
          rx="3"
          fill="var(--md3-on-surface-variant)"
          opacity="0.4"
        />

        <g
          v-for="i in [0, 1, 2, 3]"
          :key="i"
        >
          <rect
            x="16"
            :y="92 + i * 26"
            width="288"
            height="22"
            rx="6"
            :fill="
              i % 2 === 0 ? 'var(--md3-surface-container-low)' : 'transparent'
            "
          />
          <circle
            cx="30"
            :cy="103 + i * 26"
            r="7"
            :fill="avatarFill(i)"
          />
          <rect
            x="44"
            :y="100 + i * 26"
            :width="52 - i * 6"
            height="6"
            rx="3"
            fill="var(--md3-outline-variant)"
          />
          <rect
            x="166"
            :y="100 + i * 26"
            width="36"
            height="6"
            rx="3"
            fill="var(--md3-outline-variant)"
          />
          <rect
            x="236"
            :y="97 + i * 26"
            width="52"
            height="13"
            rx="6.5"
            :fill="statusFill(i)"
          />
        </g>
      </g>

      <!-- ========================================= AUTOMATED EMAILS -->
      <g v-else-if="variant === 'email'">
        <rect
          x="16"
          y="40"
          width="140"
          height="146"
          rx="11"
          fill="var(--md3-surface-container-low)"
          stroke="var(--md3-outline-variant)"
        />
        <g
          v-for="(y, i) in [54, 82, 110, 138]"
          :key="y"
        >
          <rect
            x="26"
            :y="y"
            width="120"
            height="22"
            rx="8"
            :fill="
              i === 1
                ? 'var(--md3-primary-container)'
                : 'var(--md3-surface-container-high)'
            "
          />
          <rect
            x="36"
            :y="y + 8"
            :width="72 - i * 8"
            height="6"
            rx="3"
            :fill="
              i === 1
                ? 'var(--md3-on-primary-container)'
                : 'var(--md3-on-surface-variant)'
            "
            :opacity="i === 1 ? 0.7 : 0.35"
          />
        </g>

        <rect
          x="168"
          y="40"
          width="136"
          height="146"
          rx="11"
          fill="var(--md3-surface-container)"
          stroke="var(--md3-outline-variant)"
        />
        <rect
          x="180"
          y="54"
          width="60"
          height="14"
          rx="7"
          fill="var(--md3-tertiary-container)"
        />
        <rect
          x="180"
          y="80"
          width="112"
          height="7"
          rx="3.5"
          fill="var(--md3-on-surface-variant)"
          opacity="0.45"
        />
        <rect
          v-for="(y, i) in [98, 112, 126]"
          :key="y"
          x="180"
          :y="y"
          :width="112 - i * 22"
          height="5"
          rx="2.5"
          fill="var(--md3-outline-variant)"
        />
        <rect
          x="180"
          y="150"
          width="66"
          height="22"
          rx="11"
          fill="var(--md3-primary)"
        />
        <path
          d="M206 161l8-4-8-4v3l4 1-4 1z"
          fill="var(--md3-on-primary)"
        />
      </g>

      <!-- ================================================ DASHBOARD -->
      <g v-else-if="variant === 'stats'">
        <g
          v-for="(x, i) in [16, 118, 220]"
          :key="x"
        >
          <rect
            :x="x"
            y="38"
            width="84"
            height="46"
            rx="11"
            :fill="kpiFill(i)"
          />
          <rect
            :x="x + 12"
            y="50"
            width="34"
            height="5"
            rx="2.5"
            :fill="kpiInk(i)"
            opacity="0.55"
          />
          <rect
            :x="x + 12"
            y="61"
            :width="44 - i * 8"
            height="11"
            rx="3"
            :fill="kpiInk(i)"
          />
        </g>

        <rect
          x="16"
          y="94"
          width="288"
          height="92"
          rx="11"
          fill="var(--md3-surface-container-low)"
          stroke="var(--md3-outline-variant)"
        />
        <g
          v-for="(h, i) in [26, 44, 34, 58, 40, 66, 30]"
          :key="i"
        >
          <rect
            :x="34 + i * 38"
            :y="168 - h"
            width="18"
            :height="h"
            rx="5"
            :fill="
              i === 5 ? 'var(--md3-primary)' : 'var(--md3-primary-container)'
            "
          />
          <rect
            :x="36 + i * 38"
            y="174"
            width="14"
            height="4"
            rx="2"
            fill="var(--md3-outline-variant)"
          />
        </g>
      </g>

      <!-- ============================================= ROOM PLANNER -->
      <g v-else-if="variant === 'rooms'">
        <g
          v-for="(x, i) in [16, 122, 228]"
          :key="x"
        >
          <rect
            :x="x"
            y="38"
            width="76"
            height="148"
            rx="12"
            fill="var(--md3-surface-container-low)"
            stroke="var(--md3-outline-variant)"
          />
          <rect
            :x="x + 12"
            y="50"
            width="40"
            height="6"
            rx="3"
            fill="var(--md3-on-surface-variant)"
            opacity="0.5"
          />
          <rect
            :x="x + 12"
            y="64"
            width="52"
            height="12"
            rx="6"
            :fill="
              i === 1
                ? 'var(--md3-tertiary-container)'
                : 'var(--md3-secondary-container)'
            "
          />

          <g
            v-for="(y, j) in [88, 112, 136, 160]"
            :key="y"
          >
            <rect
              :x="x + 10"
              :y="y"
              width="56"
              height="18"
              rx="7"
              :fill="
                bedFilled(i, j)
                  ? 'var(--md3-primary-container)'
                  : 'var(--md3-surface-container-high)'
              "
              :stroke="bedFilled(i, j) ? 'none' : 'var(--md3-outline-variant)'"
              :stroke-dasharray="bedFilled(i, j) ? '0' : '3 3'"
            />
            <template v-if="bedFilled(i, j)">
              <circle
                :cx="x + 20"
                :cy="y + 9"
                r="5"
                fill="var(--md3-on-primary-container)"
                opacity="0.35"
              />
              <rect
                :x="x + 30"
                :y="y + 6"
                width="28"
                height="5"
                rx="2.5"
                fill="var(--md3-on-primary-container)"
                opacity="0.45"
              />
            </template>
          </g>
        </g>
      </g>

      <!-- ========================================== PROGRAM PLANNER -->
      <g v-else-if="variant === 'calendar'">
        <rect
          v-for="(x, i) in [16, 74, 132, 190, 248]"
          :key="x"
          :x="x"
          y="38"
          width="56"
          height="16"
          rx="6"
          :fill="
            i === 2
              ? 'var(--md3-primary-container)'
              : 'var(--md3-surface-container-high)'
          "
        />
        <line
          v-for="y in [64, 94, 124, 154, 184]"
          :key="y"
          x1="16"
          x2="304"
          :y1="y"
          :y2="y"
          stroke="var(--md3-outline-variant)"
          stroke-width="1"
          stroke-dasharray="2 4"
        />
        <rect
          v-for="block in calendarBlocks"
          :key="`${block.x}-${block.y}`"
          :x="block.x"
          :y="block.y"
          width="56"
          :height="block.h"
          rx="8"
          :fill="block.fill"
        />
      </g>

      <!-- =========================================== TEAM & ACCESS -->
      <g v-else-if="variant === 'people'">
        <g
          v-for="(y, i) in [40, 76, 112, 148]"
          :key="y"
        >
          <rect
            x="16"
            :y="y"
            width="288"
            height="30"
            rx="11"
            :fill="
              i === 0
                ? 'var(--md3-primary-container)'
                : 'var(--md3-surface-container-low)'
            "
            :stroke="i === 0 ? 'none' : 'var(--md3-outline-variant)'"
          />
          <circle
            cx="34"
            :cy="y + 15"
            r="9"
            :fill="avatarFill(i)"
          />
          <rect
            x="52"
            :y="y + 9"
            :width="68 - i * 6"
            height="6"
            rx="3"
            fill="var(--md3-on-surface-variant)"
            opacity="0.55"
          />
          <rect
            x="52"
            :y="y + 20"
            :width="92 - i * 8"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
          />
          <rect
            x="212"
            :y="y + 8"
            width="76"
            height="14"
            rx="7"
            :fill="roleFill(i)"
          />
        </g>
      </g>

      <!-- =========================================== GROUP MESSAGES -->
      <g v-else-if="variant === 'inbox'">
        <rect
          v-for="(chip, i) in recipientChips"
          :key="chip.x"
          :x="chip.x"
          y="40"
          :width="chip.w"
          height="20"
          rx="10"
          :fill="
            i === 1
              ? 'var(--md3-surface-container-high)'
              : 'var(--md3-primary-container)'
          "
        />
        <rect
          x="16"
          y="72"
          width="288"
          height="60"
          rx="11"
          fill="var(--md3-surface-container-low)"
          stroke="var(--md3-outline-variant)"
        />
        <rect
          x="28"
          y="84"
          width="130"
          height="7"
          rx="3.5"
          fill="var(--md3-on-surface-variant)"
          opacity="0.5"
        />
        <rect
          v-for="(y, i) in [102, 114]"
          :key="y"
          x="28"
          :y="y"
          :width="248 - i * 70"
          height="5"
          rx="2.5"
          fill="var(--md3-outline-variant)"
        />

        <g
          v-for="(x, i) in [16, 116, 216]"
          :key="x"
        >
          <rect
            :x="x"
            y="144"
            width="88"
            height="42"
            rx="11"
            fill="var(--md3-surface-container)"
            stroke="var(--md3-outline-variant)"
          />
          <circle
            :cx="x + 18"
            cy="165"
            r="8"
            :fill="deliveryFill(i)"
          />
          <rect
            :x="x + 32"
            y="158"
            width="42"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
          />
          <rect
            :x="x + 32"
            y="168"
            width="30"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
            opacity="0.6"
          />
        </g>
      </g>

      <!-- ================================================ NEWSLETTER -->
      <g v-else-if="variant === 'newsletter'">
        <rect
          x="16"
          y="38"
          width="176"
          height="148"
          rx="11"
          fill="var(--md3-surface-container-low)"
          stroke="var(--md3-outline-variant)"
        />
        <rect
          x="16"
          y="38"
          width="176"
          height="34"
          rx="11"
          fill="var(--md3-primary-container)"
        />
        <rect
          x="16"
          y="60"
          width="176"
          height="12"
          fill="var(--md3-primary-container)"
        />
        <rect
          x="30"
          y="50"
          width="82"
          height="9"
          rx="4.5"
          fill="var(--md3-on-primary-container)"
          opacity="0.6"
        />
        <rect
          v-for="(y, i) in [86, 100, 114, 128]"
          :key="y"
          x="30"
          :y="y"
          :width="148 - (i % 2) * 46"
          height="5"
          rx="2.5"
          fill="var(--md3-outline-variant)"
        />
        <rect
          x="30"
          y="150"
          width="62"
          height="20"
          rx="10"
          fill="var(--md3-primary)"
        />

        <rect
          x="204"
          y="38"
          width="100"
          height="148"
          rx="11"
          fill="var(--md3-surface-container)"
          stroke="var(--md3-outline-variant)"
        />
        <rect
          x="216"
          y="50"
          width="52"
          height="14"
          rx="7"
          fill="var(--md3-tertiary-container)"
        />
        <g
          v-for="(y, i) in [82, 104, 126, 148, 170]"
          :key="y"
        >
          <circle
            cx="226"
            :cy="y"
            r="7"
            :fill="avatarFill(i)"
          />
          <rect
            x="240"
            :y="y - 3"
            :width="52 - (i % 3) * 8"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
          />
        </g>
      </g>

      <!-- ===================================================== TASKS -->
      <g v-else-if="variant === 'checklist'">
        <rect
          v-for="(chip, i) in taskFilterChips"
          :key="chip.x"
          :x="chip.x"
          y="38"
          :width="chip.w"
          height="18"
          rx="9"
          :fill="
            i === 0
              ? 'var(--md3-primary-container)'
              : 'var(--md3-surface-container-high)'
          "
        />
        <g
          v-for="(y, i) in [68, 100, 132, 164]"
          :key="y"
        >
          <rect
            x="16"
            :y="y"
            width="288"
            height="26"
            rx="10"
            fill="var(--md3-surface-container-low)"
            stroke="var(--md3-outline-variant)"
          />
          <rect
            x="28"
            :y="y + 8"
            width="11"
            height="11"
            rx="3.5"
            :fill="i < 2 ? 'var(--md3-primary)' : 'none'"
            :stroke="i < 2 ? 'none' : 'var(--md3-outline)'"
            stroke-width="1.4"
          />
          <path
            v-if="i < 2"
            :d="`M30.5 ${y + 13.5}l2.5 2.5 4-5`"
            stroke="var(--md3-on-primary)"
            stroke-width="1.6"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <rect
            x="50"
            :y="y + 10"
            :width="120 - i * 14"
            height="6"
            rx="3"
            fill="var(--md3-outline-variant)"
            :opacity="i < 2 ? 0.55 : 1"
          />
          <rect
            x="214"
            :y="y + 7"
            width="40"
            height="12"
            rx="6"
            :fill="
              i === 2
                ? 'var(--md3-error-container)'
                : 'var(--md3-surface-container-high)'
            "
          />
          <circle
            cx="282"
            :cy="y + 13"
            r="8"
            :fill="avatarFill(i)"
          />
        </g>
      </g>

      <!-- ============================================== DUTY ROSTER -->
      <g v-else-if="variant === 'rota'">
        <rect
          v-for="(x, i) in [16, 74, 132, 190, 248]"
          :key="x"
          :x="x"
          y="38"
          width="56"
          height="18"
          rx="7"
          :fill="
            i === 1
              ? 'var(--md3-primary-container)'
              : 'var(--md3-surface-container-high)'
          "
        />
        <g
          v-for="(y, r) in [66, 112, 158]"
          :key="y"
        >
          <rect
            x="16"
            :y="y"
            width="288"
            height="34"
            rx="10"
            :fill="
              r === 0
                ? 'var(--md3-secondary-container)'
                : 'var(--md3-surface-container-low)'
            "
            :stroke="r === 0 ? 'none' : 'var(--md3-outline-variant)'"
          />
          <rect
            x="28"
            :y="y + 8"
            width="46"
            height="6"
            rx="3"
            fill="var(--md3-on-surface-variant)"
            opacity="0.5"
          />
          <rect
            x="28"
            :y="y + 20"
            width="30"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
          />
          <circle
            v-for="(cx, i) in [186, 206, 226, 246]"
            :key="cx"
            :cx="cx"
            :cy="y + 17"
            r="9"
            :fill="avatarFill(r + i)"
            stroke="var(--md3-surface-container-lowest)"
            stroke-width="1.5"
          />
          <rect
            x="264"
            :y="y + 10"
            width="28"
            height="14"
            rx="7"
            fill="var(--md3-surface-container-high)"
          />
        </g>
      </g>

      <!-- ===================================================== FILES -->
      <g v-else-if="variant === 'files'">
        <g
          v-for="(cell, i) in fileCells"
          :key="i"
        >
          <rect
            :x="cell.x"
            :y="cell.y"
            width="136"
            height="64"
            rx="11"
            :fill="
              cell.missing ? 'transparent' : 'var(--md3-surface-container-low)'
            "
            :stroke="
              cell.missing ? 'var(--md3-error)' : 'var(--md3-outline-variant)'
            "
            :stroke-dasharray="cell.missing ? '4 4' : '0'"
          />
          <rect
            :x="cell.x + 14"
            :y="cell.y + 16"
            width="24"
            height="32"
            rx="5"
            :fill="cell.missing ? 'var(--md3-error-container)' : docFill(i)"
          />
          <rect
            :x="cell.x + 48"
            :y="cell.y + 22"
            :width="70 - (i % 3) * 10"
            height="6"
            rx="3"
            fill="var(--md3-on-surface-variant)"
            opacity="0.5"
          />
          <rect
            :x="cell.x + 48"
            :y="cell.y + 36"
            width="42"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
          />
        </g>
      </g>

      <!-- ============================================ ORGANIZATIONS -->
      <g v-else-if="variant === 'org'">
        <rect
          x="98"
          y="40"
          width="124"
          height="46"
          rx="12"
          fill="var(--md3-primary-container)"
        />
        <circle
          cx="122"
          cy="63"
          r="11"
          fill="var(--md3-on-primary-container)"
          opacity="0.25"
        />
        <rect
          x="140"
          y="52"
          width="60"
          height="7"
          rx="3.5"
          fill="var(--md3-on-primary-container)"
          opacity="0.65"
        />
        <circle
          cx="146"
          cy="70"
          r="6"
          fill="var(--md3-tertiary)"
        />
        <path
          d="M143 70l2.2 2.2 4-4.4"
          stroke="var(--md3-on-tertiary)"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          x="156"
          y="67"
          width="44"
          height="6"
          rx="3"
          fill="var(--md3-on-primary-container)"
          opacity="0.35"
        />

        <path
          d="M160 86v18M60 104h200M60 104v14M160 104v14M260 104v14"
          stroke="var(--md3-outline-variant)"
          stroke-width="1.6"
          fill="none"
        />

        <g
          v-for="(x, i) in [16, 116, 216]"
          :key="x"
        >
          <rect
            :x="x"
            y="118"
            width="88"
            height="66"
            rx="11"
            fill="var(--md3-surface-container-low)"
            stroke="var(--md3-outline-variant)"
          />
          <rect
            :x="x + 12"
            y="130"
            width="26"
            height="26"
            rx="8"
            :fill="kpiFill(i)"
          />
          <rect
            :x="x + 12"
            y="164"
            :width="60 - i * 8"
            height="6"
            rx="3"
            fill="var(--md3-outline-variant)"
          />
        </g>
      </g>

      <!-- ============================================ PRIVACY NOTICE -->
      <g v-else-if="variant === 'shield'">
        <rect
          x="16"
          y="38"
          width="164"
          height="148"
          rx="11"
          fill="var(--md3-surface-container-low)"
          stroke="var(--md3-outline-variant)"
        />
        <rect
          x="30"
          y="52"
          width="90"
          height="8"
          rx="4"
          fill="var(--md3-on-surface-variant)"
          opacity="0.5"
        />
        <g
          v-for="(y, i) in [74, 106, 138]"
          :key="y"
        >
          <rect
            x="30"
            :y="y"
            width="52"
            height="12"
            rx="6"
            :fill="kpiFill(i)"
          />
          <rect
            x="30"
            :y="y + 18"
            width="136"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
          />
          <rect
            x="30"
            :y="y + 27"
            :width="104 - i * 18"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
            opacity="0.7"
          />
        </g>

        <path
          d="M248 50l40 15v28c0 25-17 40-40 48-23-8-40-23-40-48V65z"
          fill="var(--md3-tertiary-container)"
        />
        <path
          d="M234 92l10 10 21-23"
          stroke="var(--md3-on-tertiary-container)"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          x="208"
          y="158"
          width="80"
          height="10"
          rx="5"
          fill="var(--md3-outline-variant)"
        />
        <rect
          x="208"
          y="174"
          width="54"
          height="10"
          rx="5"
          fill="var(--md3-outline-variant)"
          opacity="0.6"
        />
      </g>

      <!-- ========================================== EVENT DIRECTORY -->
      <g v-else-if="variant === 'directory'">
        <rect
          x="16"
          y="38"
          width="192"
          height="22"
          rx="11"
          fill="var(--md3-surface-container)"
          stroke="var(--md3-outline-variant)"
        />
        <circle
          cx="32"
          cy="48"
          r="4.5"
          fill="none"
          stroke="var(--md3-on-surface-variant)"
          stroke-width="1.6"
        />
        <path
          d="M35.5 51.5l3.5 3.5"
          stroke="var(--md3-on-surface-variant)"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <rect
          x="216"
          y="38"
          width="42"
          height="22"
          rx="11"
          fill="var(--md3-primary-container)"
        />
        <rect
          x="264"
          y="38"
          width="40"
          height="22"
          rx="11"
          fill="var(--md3-surface-container-high)"
        />

        <g
          v-for="(y, i) in [72, 112, 152]"
          :key="y"
        >
          <rect
            x="16"
            :y="y"
            width="288"
            height="34"
            rx="11"
            fill="var(--md3-surface-container-low)"
            stroke="var(--md3-outline-variant)"
          />
          <rect
            x="28"
            :y="y + 7"
            width="30"
            height="20"
            rx="7"
            :fill="kpiFill(i)"
          />
          <rect
            x="68"
            :y="y + 8"
            :width="112 - i * 16"
            height="7"
            rx="3.5"
            fill="var(--md3-on-surface-variant)"
            opacity="0.5"
          />
          <rect
            x="68"
            :y="y + 20"
            :width="76 - i * 10"
            height="5"
            rx="2.5"
            fill="var(--md3-outline-variant)"
          />
          <rect
            x="228"
            :y="y + 9"
            width="60"
            height="16"
            rx="8"
            :fill="
              i === 2
                ? 'var(--md3-surface-container-high)'
                : 'var(--md3-primary)'
            "
          />
        </g>
      </g>
    </g>

    <rect
      x="0.5"
      y="0.5"
      width="319"
      height="199"
      rx="14"
      fill="none"
      stroke="var(--md3-outline-variant)"
    />
  </svg>
</template>

<script lang="ts" setup>
import { useId } from 'vue';
import type { FeaturePreviewVariant } from './landing-features';

defineProps<{
  variant: FeaturePreviewVariant;
  label: string;
}>();

// clipPath ids are document-global; several previews can be mounted at once.
const clipId = `landing-preview-${useId()}`;

const containers = [
  'var(--md3-primary-container)',
  'var(--md3-tertiary-container)',
  'var(--md3-secondary-container)',
];

const inks = [
  'var(--md3-on-primary-container)',
  'var(--md3-on-tertiary-container)',
  'var(--md3-on-secondary-container)',
];

const pick = (list: string[], i: number): string =>
  list[((i % list.length) + list.length) % list.length]!;

const kpiFill = (i: number) => pick(containers, i);
const kpiInk = (i: number) => pick(inks, i);
const docFill = (i: number) => pick(containers, i);
const avatarFill = (i: number) => pick(containers, i + 1);
const statusFill = (i: number) => pick(containers, i + 1);
const roleFill = (i: number) =>
  i === 0 ? 'var(--md3-on-primary-container)' : pick(containers, i);
const deliveryFill = (i: number) => pick(containers, i + 1);

// A room is four beds; the middle room is full, the outer ones are not.
const bedFilled = (room: number, bed: number): boolean =>
  room === 1 || bed < 3 - room;

const calendarBlocks = [
  { x: 16, y: 68, h: 44, fill: 'var(--md3-primary-container)' },
  { x: 74, y: 68, h: 26, fill: 'var(--md3-secondary-container)' },
  { x: 74, y: 128, h: 52, fill: 'var(--md3-tertiary-container)' },
  { x: 132, y: 98, h: 56, fill: 'var(--md3-primary-container)' },
  { x: 190, y: 68, h: 30, fill: 'var(--md3-tertiary-container)' },
  { x: 190, y: 158, h: 22, fill: 'var(--md3-secondary-container)' },
  { x: 248, y: 98, h: 82, fill: 'var(--md3-primary-container)' },
];

const fileCells = [
  { x: 16, y: 40, missing: false },
  { x: 168, y: 40, missing: false },
  { x: 16, y: 118, missing: false },
  { x: 168, y: 118, missing: true },
];

const recipientChips = [
  { x: 16, w: 72 },
  { x: 96, w: 58 },
  { x: 162, w: 84 },
];

const taskFilterChips = [
  { x: 16, w: 64 },
  { x: 88, w: 72 },
  { x: 168, w: 90 },
];
</script>

<style lang="scss" scoped>
.preview {
  display: block;
  width: 100%;
  height: auto;
}
</style>
