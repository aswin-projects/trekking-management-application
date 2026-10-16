const UserTreks = {
  components: { Contour },
  data() {
    return {
      treks: [], difficulty: "", location: "", duration: "", q: "",
      bookingTrek: null, numSlots: 1, error: "", success: "",
    };
  },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      const params = new URLSearchParams();
      if (this.difficulty) params.set("difficulty", this.difficulty);
      if (this.location) params.set("location", this.location);
      if (this.duration) params.set("duration", this.duration);
      if (this.q) params.set("q", this.q);
      const res = await TMA.get("/api/treks?" + params.toString());
      this.treks = res.treks;
    },
    openBook(t) {
      this.bookingTrek = t; this.numSlots = 1; this.error = ""; this.success = "";
    },
    async confirmBook() {
      this.error = "";
      try {
        await TMA.post("/api/bookings", { trek_id: this.bookingTrek.id, num_slots: this.numSlots });
        this.success = "Trek booked! Check My Bookings for details.";
        this.bookingTrek = null;
        await this.load();
      } catch (e) { this.error = e.message; }
    },
  },
  template: `
    <div>
      <div class="mb-4">
        <div class="section-eyebrow">Find your next summit</div>
        <h2 class="mb-0">Explore Treks</h2>
      </div>

      <div v-if="success" class="alert alert-success py-2">{{ success }}</div>

      <div class="card p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-3">
            <input v-model="q" @keyup.enter="load" class="form-control" placeholder="Search name or location…">
          </div>
          <div class="col-md-3">
            <select v-model="difficulty" @change="load" class="form-select">
              <option value="">Any difficulty</option>
              <option>Easy</option><option>Moderate</option><option>Hard</option>
            </select>
          </div>
          <div class="col-md-3">
            <input v-model="location" @keyup.enter="load" class="form-control" placeholder="Location">
          </div>
          <div class="col-md-2">
            <input v-model="duration" @keyup.enter="load" type="number" min="1" class="form-control" placeholder="Days">
          </div>
          <div class="col-md-1">
            <button class="btn btn-forest w-100" @click="load"><i class="bi bi-search"></i></button>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6 col-xl-4" v-for="t in treks" :key="t.id">
          <div class="card trek-card">
            <div class="trek-banner"><Contour /></div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="mb-1">{{ t.name }}</h5>
                <span class="fw-semibold mono">₹{{ t.price }}</span>
              </div>
              <div class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> {{ t.location }}</div>
              <div class="small mb-3">
                <span :class="'difficulty-' + t.difficulty" class="fw-semibold">{{ t.difficulty }}</span>
                · {{ t.duration_days }} days · <span class="mono">{{ t.available_slots }} slots left</span>
              </div>
              <button class="btn btn-sm btn-amber w-100" :disabled="t.available_slots < 1" @click="openBook(t)">
                {{ t.available_slots < 1 ? 'Fully booked' : 'Book this trek' }}
              </button>
            </div>
          </div>
        </div>
        <div class="col-12" v-if="!treks.length">
          <div class="empty-state">No open treks match your filters right now.</div>
        </div>
      </div>

      <div v-if="bookingTrek" class="modal d-block" style="background:rgba(0,0,0,0.4)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Book "{{ bookingTrek.name }}"</h5>
              <button class="btn-close" @click="bookingTrek=null"></button>
            </div>
            <div class="modal-body">
              <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
              <label class="form-label">Number of slots</label>
              <input v-model.number="numSlots" type="number" min="1" :max="bookingTrek.available_slots" class="form-control mb-2">
              <div class="small text-muted">Total: ₹{{ (bookingTrek.price * numSlots).toFixed(0) }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" @click="bookingTrek=null">Cancel</button>
              <button class="btn btn-amber" @click="confirmBook">Confirm booking</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
