const StaffTrekDetail = {
  data() { return { trek: null, bookings: [], slotsInput: 0 }; },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      const res = await TMA.get("/api/staff/treks");
      this.trek = res.treks.find(t => t.id === Number(this.$route.params.id));
      if (this.trek) {
        this.slotsInput = this.trek.available_slots;
        const b = await TMA.get(`/api/staff/treks/${this.trek.id}/bookings`);
        this.bookings = b.bookings;
      }
    },
    async updateSlots() {
      await TMA.put(`/api/staff/treks/${this.trek.id}`, { available_slots: this.slotsInput });
      await this.load();
    },
    async setStatus(status) {
      await TMA.put(`/api/staff/treks/${this.trek.id}`, { status });
      await this.load();
    },
    async markCompleted() {
      if (!confirm("Mark this trek as completed? All active bookings will be closed out.")) return;
      await TMA.put(`/api/staff/treks/${this.trek.id}/complete`);
      await this.load();
    },
    async markPaid(b) {
      await TMA.put(`/api/staff/bookings/${b.id}/payment`, { payment_status: "Paid" });
      await this.load();
    },
  },
  template: `
    <div v-if="trek">
      <router-link to="/staff" class="text-decoration-none small text-muted"><i class="bi bi-arrow-left"></i> Back to my treks</router-link>
      <div class="d-flex justify-content-between align-items-start mt-2 mb-4">
        <div>
          <h2 class="mb-0">{{ trek.name }}</h2>
          <div class="text-muted"><i class="bi bi-geo-alt"></i> {{ trek.location }} ·
            <span :class="'difficulty-' + trek.difficulty" class="fw-semibold">{{ trek.difficulty }}</span> ·
            {{ trek.duration_days }} days</div>
        </div>
        <span class="badge badge-status fs-6" :class="'status-' + trek.status">{{ trek.status }}</span>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card p-3">
            <h6>Available slots</h6>
            <div class="input-group mb-2" style="max-width:220px">
              <input type="number" min="0" :max="trek.total_slots" v-model.number="slotsInput" class="form-control">
              <button class="btn btn-forest" @click="updateSlots">Update</button>
            </div>
            <div class="small text-muted mono">Total capacity: {{ trek.total_slots }}</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card p-3">
            <h6>Trek status</h6>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm" :class="trek.status==='Open' ? 'btn-forest' : 'btn-outline-forest'" @click="setStatus('Open')">Open</button>
              <button class="btn btn-sm" :class="trek.status==='Closed' ? 'btn-forest' : 'btn-outline-forest'" @click="setStatus('Closed')">Closed</button>
              <button class="btn btn-sm btn-outline-danger" @click="markCompleted" :disabled="trek.status==='Completed'">
                Mark completed
              </button>
            </div>
          </div>
        </div>
      </div>

      <h5 class="mb-3">Registered trekkers</h5>
      <div class="table-responsive">
        <table class="table bg-white align-middle">
          <thead>
            <tr class="text-uppercase small text-muted">
              <th>Name</th><th>Email</th><th>Slots</th><th>Status</th><th>Payment</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bookings" :key="b.id">
              <td class="fw-semibold">{{ b.user_name }}</td>
              <td class="small">{{ b.user_email }}</td>
              <td class="mono">{{ b.num_slots }}</td>
              <td><span class="badge badge-status" :class="'status-' + b.status">{{ b.status }}</span></td>
              <td class="small">
                <span class="badge" :class="b.payment_status === 'Paid' ? 'status-Open badge-status' : 'status-Pending badge-status'">
                  {{ b.payment_status }}
                </span>
              </td>
              <td class="text-end">
                <button v-if="b.payment_status !== 'Paid'" class="btn btn-sm btn-amber" @click="markPaid(b)">
                  Mark as paid
                </button>
              </td>
            </tr>
            <tr v-if="!bookings.length"><td colspan="6" class="empty-state">No bookings yet for this trek.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="empty-state">Loading trek…</div>
  `,
};
