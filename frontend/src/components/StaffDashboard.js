const StaffDashboard = {
  components: { Contour },
  data() { return { treks: [] }; },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      const res = await TMA.get("/api/staff/treks");
      this.treks = res.treks;
    },
    async quickToggle(t) {
      const status = t.status === "Open" ? "Closed" : "Open";
      await TMA.put(`/api/staff/treks/${t.id}`, { status });
      await this.load();
    },
  },
  template: `
    <div>
      <div class="mb-4">
        <div class="section-eyebrow">Field Operations</div>
        <h2 class="mb-0">My Treks</h2>
      </div>

      <div class="row g-3">
        <div class="col-md-6 col-xl-4" v-for="t in treks" :key="t.id">
          <div class="card trek-card">
            <div class="trek-banner"><Contour /></div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="mb-1">{{ t.name }}</h5>
                <span class="badge badge-status" :class="'status-' + t.status">{{ t.status }}</span>
              </div>
              <div class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> {{ t.location }}</div>
              <div class="small mb-2">
                <span :class="'difficulty-' + t.difficulty" class="fw-semibold">{{ t.difficulty }}</span>
                · {{ t.duration_days }} days · <span class="mono">{{ t.available_slots }}/{{ t.total_slots }} slots</span>
              </div>
              <div class="d-flex gap-2">
                <router-link :to="'/staff/treks/' + t.id" class="btn btn-sm btn-outline-forest">Manage</router-link>
                <button class="btn btn-sm btn-outline-secondary" v-if="t.status==='Open' || t.status==='Closed'" @click="quickToggle(t)">
                  {{ t.status === 'Open' ? 'Close' : 'Reopen' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12" v-if="!treks.length">
          <div class="empty-state">No treks assigned to you yet. Check back once the admin assigns one.</div>
        </div>
      </div>
    </div>
  `,
};
