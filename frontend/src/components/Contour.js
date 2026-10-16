// Signature element: concentric contour lines evoking a topographic elevation
// map, used as a quiet background texture in the sidebar, auth screen and
// empty states. Purely decorative — aria-hidden.
const Contour = {
  props: { seed: { type: Number, default: 1 } },
  template: `
    <svg class="contour-bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="#ffffff" stroke-width="1.2">
        <path d="M -20 260 Q 60 200 140 250 T 300 230 T 460 260" :style="{opacity:0.9}"/>
        <path d="M -20 220 Q 70 160 150 210 T 310 190 T 460 220" :style="{opacity:0.7}"/>
        <path d="M -20 180 Q 80 120 160 170 T 320 150 T 460 180" :style="{opacity:0.5}"/>
        <path d="M -20 140 Q 90 90 170 130 T 330 110 T 460 140" :style="{opacity:0.35}"/>
        <path d="M -20 100 Q 100 60 180 90 T 340 70 T 460 100" :style="{opacity:0.2}"/>
      </g>
    </svg>
  `,
};
