const AdminStaff = {
  data() {
    return { staff: [], showForm: false, form: this.blankForm(), error: "" };
  },
  computed: {
    pendingStaff() { return this.staff.filter(s => s.status === "pending"); },
    otherStaff() { return this.staff.filter(s => s.status !== "pending"); },
  },
  async mounted() { await this.load(); },
  methods: {
    blankForm() {
      return { name: "", email: "", phone: "", password: "", contact_details: "", bio: "" };
    },
    async load() {
      const res = await TMA.get("/api/admin/staff");
      this.staff = res.staff;
    },
    openCreate() { this.form = this.blankForm(); this.error = ""; this.showForm = true; },
    async save() {
      this.error = "";
      try {
        await TMA.post("/api/admin/staff", this.form);
        this.showForm = false;
        await this.load();
      } catch (e) { this.error = e.message; }
    },
    async approve(s) {
      await TMA.put(`/api/admin/staff/${s.id}`, { status: "active" });
      await this.load();
    },
    async toggleStatus(s) {
      const status = s.status === "active" ? "inactive" : "active";
      await TMA.put(`/api/admin/staff/${s.id}`, { status });
      await this.load();
    },
    async reject(s) {
      if (!confirm(`Reject and remove the registration for "${s.name}"?`)) return;
      await TMA.del(`/api/admin/staff/${s.id}`);
      await this.load();
    },
    async remove(s) {
      if (!confirm(`Remove staff member "${s.name}"? Their trek assignments will be cleared.`)) return;
      await TMA.del(`/api/admin/staff/${s.id}`);
      await this.load();
    },
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div class="section-eyebrow">Team</div>
          <h2 class="mb-0">Trek Staff</h2>
        </div>
        <button class="btn btn-amber" @click="openCreate"><i class="bi bi-person-plus"></i> Add staff</button>
      </div>

      <div v-if="pendingStaff.length" class="card p-3 mb-4" style="border-color:#C97C3D">
        <h6 class="mb-3"><i class="bi bi-hourglass-split"></i> Pending approval ({{ pendingStaff.length }})</h6>
        <table class="table table-sm bg-white align-middle mb-0">
          <tbody>
            <tr v-for="s in pendingStaff" :key="s.id">
              <td>
                <div class="fw-semibold">{{ s.name }}</div>
                <div class="small text-muted">{{ s.email }} · {{ s.contact_details || 'no contact given' }}</div>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-forest me-1" @click="approve(s)"><i class="bi bi-check-lg"></i> Approve</button>
                <button class="btn btn-sm btn-outline-danger" @click="reject(s)"><i class="bi bi-x-lg"></i> Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-responsive">
        <table class="table bg-white align-middle">
          <thead>
            <tr class="text-uppercase small text-muted">
              <th>Name</th><th>Contact</th><th>Assigned treks</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in otherStaff" :key="s.id">
              <td>
                <div class="fw-semibold">{{ s.name }}</div>
                <div class="small text-muted">{{ s.email }}</div>
              </td>
              <td class="small">{{ s.contact_details || '—' }}</td>
              <td class="mono">{{ s.assigned_trek_count }}</td>
              <td>
                <span class="badge badge-status" :class="s.status === 'active' ? 'status-Open' : 'status-Closed'">
                  {{ s.status }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-forest me-1" @click="toggleStatus(s)">
                  {{ s.status === 'active' ? 'Deactivate' : 'Activate' }}
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="remove(s)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
            <tr v-if="!otherStaff.length"><td colspan="5" class="empty-state">No trek staff yet. Add your first team member.</td></tr>
          </tbody>
        </table>
      </div>

      <div v-if="showForm" class="modal d-block" style="background:rgba(0,0,0,0.4)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add trek staff</h5>
              <button class="btn-close" @click="showForm=false"></button>
            </div>
            <div class="modal-body">
              <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
              <div class="mb-3"><label class="form-label">Name</label><input v-model="form.name" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Email</label><input v-model="form.email" type="email" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Phone</label><input v-model="form.phone" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Temporary password</label><input v-model="form.password" type="text" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Contact details</label><input v-model="form.contact_details" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Bio</label><textarea v-model="form.bio" class="form-control" rows="2"></textarea></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" @click="showForm=false">Cancel</button>
              <button class="btn btn-amber" @click="save">Create staff account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
