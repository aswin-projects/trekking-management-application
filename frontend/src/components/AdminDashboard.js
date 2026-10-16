const AdminDashboard = {
  data() {
    return { stats: null, loading: true, msg: "" };
  },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      this.loading = true;
      const res = await TMA.get("/api/admin/reports");
      this.stats = res.stats;
      this.loading = false;
    },
    async refresh() {
      this.msg = "Queued a background job to recompute stats…";
      await TMA.post("/api/admin/reports/refresh");
      setTimeout(async () => { await this.load(); this.msg = "Stats refreshed."; }, 1500);
    },
    async sendReminders() {
      this.msg = "Queued reminder batch job for upcoming treks…";
      await TMA.post("/api/admin/reminders/send");
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div class="section-eyebrow">Basecamp HQ</div>
          <h2 class="mb-0">Overview</h2>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-forest btn-sm" @click="sendReminders">
            <i class="bi bi-bell"></i> Send trek reminders
          </button>
          <button class="btn btn-forest btn-sm" @click="refresh">
            <i class="bi bi-arrow-clockwise"></i> Recompute stats
          </button>
        </div>
      </div>

      <div v-if="msg" class="alert alert-light border py-2">{{ msg }}</div>

      <div v-if="loading" class="text-muted">Loading…</div>
      <div v-else class="row g-3">
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="value mono">{{ stats.total_treks }}</div>
            <div class="label">Total Treks</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="value mono">{{ stats.total_bookings }}</div>
            <div class="label">Total Bookings</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="value mono">{{ stats.total_users }}</div>
            <div class="label">Registered Trekkers</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="value mono">{{ stats.total_staff }}</div>
            <div class="label">Trek Staff</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="value mono">{{ stats.completed_treks }}</div>
            <div class="label">Completed Treks</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="value mono">₹{{ stats.revenue.toFixed(0) }}</div>
            <div class="label">Revenue (paid)</div>
          </div>
        </div>
      </div>
    </div>
  `,
};
