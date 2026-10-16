const AdminTreks = {
  data() {
    return {
      treks: [], staffList: [], showForm: false, editing: null,
      form: this.blankForm(), search: "", error: "",
    };
  },
  computed: {
    filtered() {
      if (!this.search) return this.treks;
      const q = this.search.toLowerCase();
      return this.treks.filter(t => t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q));
    },
  },
  async mounted() {
    await this.loadTreks();
    const staffRes = await TMA.get("/api/admin/staff");
    this.staffList = staffRes.staff;
  },
  methods: {
    blankForm() {
      return {
        name: "", location: "", difficulty: "Moderate", duration_days: 3,
        total_slots: 10, price: 0, description: "", status: "Pending",
        start_date: "", end_date: "",
      };
    },
    async loadTreks() {
      const res = await TMA.get("/api/admin/treks");
      this.treks = res.treks;
    },
    openCreate() {
      this.editing = null;
      this.form = this.blankForm();
      this.showForm = true;
      this.error = "";
    },
    openEdit(t) {
      this.editing = t;
      this.form = {
        name: t.name, location: t.location, difficulty: t.difficulty,
        duration_days: t.duration_days, total_slots: t.total_slots, price: t.price,
        description: t.description || "", status: t.status,
        start_date: t.start_date || "", end_date: t.end_date || "",
      };
      this.showForm = true;
      this.error = "";
    },
    async save() {
      this.error = "";
      try {
        if (this.editing) {
          await TMA.put(`/api/admin/treks/${this.editing.id}`, this.form);
        } else {
          await TMA.post("/api/admin/treks", this.form);
        }
        this.showForm = false;
        await this.loadTreks();
      } catch (e) { this.error = e.message; }
    },
    async remove(t) {
      if (!confirm(`Remove trek "${t.name}"? This cannot be undone.`)) return;
      await TMA.del(`/api/admin/treks/${t.id}`);
      await this.loadTreks();
    },
    async assign(t, staffProfileId) {
      await TMA.put(`/api/admin/treks/${t.id}/assign`, {
        staff_profile_id: staffProfileId || null,
      });
      await this.loadTreks();
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div class="section-eyebrow">Route Planning</div>
          <h2 class="mb-0">Treks</h2>
        </div>
        <button class="btn btn-amber" @click="openCreate"><i class="bi bi-plus-lg"></i> New trek</button>
      </div>

      <input v-model="search" class="form-control mb-3" style="max-width:320px" placeholder="Search by name or location…">

      <div class="table-responsive">
        <table class="table bg-white align-middle">
          <thead>
            <tr class="text-uppercase small text-muted">
              <th>Trek</th><th>Difficulty</th><th>Dates</th><th>Slots</th><th>Staff</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filtered" :key="t.id">
              <td>
                <div class="fw-semibold">{{ t.name }}</div>
                <div class="small text-muted">{{ t.location }}</div>
              </td>
              <td><span :class="'difficulty-' + t.difficulty" class="fw-semibold">{{ t.difficulty }}</span></td>
              <td class="small mono">{{ t.start_date || '—' }} → {{ t.end_date || '—' }}</td>
              <td class="mono">{{ t.available_slots }}/{{ t.total_slots }}</td>
              <td style="min-width:180px">
                <select class="form-select form-select-sm" :value="t.assigned_staff_id || ''"
                  @change="assign(t, $event.target.value)">
                  <option value="">Unassigned</option>
                  <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </td>
              <td><span class="badge badge-status" :class="'status-' + t.status">{{ t.status }}</span></td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-forest me-1" @click="openEdit(t)"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" @click="remove(t)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="7" class="empty-state">No treks yet. Create one to get started.</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Create / Edit modal -->
      <div v-if="showForm" class="modal d-block" style="background:rgba(0,0,0,0.4)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editing ? 'Edit trek' : 'New trek' }}</h5>
              <button class="btn-close" @click="showForm=false"></button>
            </div>
            <div class="modal-body">
              <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Trek name</label>
                  <input v-model="form.name" class="form-control">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Location</label>
                  <input v-model="form.location" class="form-control">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Difficulty</label>
                  <select v-model="form.difficulty" class="form-select">
                    <option>Easy</option><option>Moderate</option><option>Hard</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Duration (days)</label>
                  <input v-model.number="form.duration_days" type="number" min="1" class="form-control">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Total slots</label>
                  <input v-model.number="form.total_slots" type="number" min="0" class="form-control">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Price (₹)</label>
                  <input v-model.number="form.price" type="number" min="0" class="form-control">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Status</label>
                  <select v-model="form.status" class="form-select">
                    <option>Pending</option><option>Approved</option><option>Open</option>
                    <option>Closed</option><option>Completed</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Start date</label>
                  <input v-model="form.start_date" type="date" class="form-control">
                </div>
                <div class="col-md-4">
                  <label class="form-label">End date</label>
                  <input v-model="form.end_date" type="date" class="form-control">
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea v-model="form.description" class="form-control" rows="3"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" @click="showForm=false">Cancel</button>
              <button class="btn btn-amber" @click="save">Save trek</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
