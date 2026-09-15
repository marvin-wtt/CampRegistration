<script setup lang="ts">
interface Props {
  subject: string;
  preview: string;
}

defineProps<Props>();
</script>

<template>
  <mj-head>
    <mj-title>{{ subject }}</mj-title>
    <mj-preview>{{ preview }}</mj-preview>
    <mj-raw>
      <meta
        name="color-scheme"
        content="light"
      />
      <meta
        name="supported-color-schemes"
        content="light"
      />
    </mj-raw>
    <mj-attributes>
      <mj-all
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
      />
    </mj-attributes>
    <mj-style>
      :root { color-scheme: light; } .body-text p { margin: 0 0 1em 0; }
      .body-text p:last-child { margin-bottom: 0; } .body-text ul, .body-text ol
      { margin: 0 0 1em 0; padding-left: 1.5em; } .body-text li { margin-bottom:
      0.25em; } .body-text a { color: inherit; } .body-text
      .registration-changes { margin: 0 0 1em 0; padding-left: 1.5em; }
      .body-text .registration-changes li { margin-bottom: 0.25em; } /*
      `color-scheme`/`supported-color-schemes` above are enough for compliant
      clients, but Gmail and Outlook.com ignore them and auto-invert dark text
      on a white background. `u + .email-body` only matches inside Gmail's own
      dark-mode wrapper; `[data-ogsc]` is Outlook.com's dark-mode marker. */ u +
      .email-body .email-force-dark-text, [data-ogsc] .email-force-dark-text {
      color: #111827 !important; }
    </mj-style>
  </mj-head>
</template>
