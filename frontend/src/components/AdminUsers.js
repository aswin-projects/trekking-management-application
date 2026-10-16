const AdminUsers = {
  data() { return { users: [], search: "" }; },
  computed: {
    filtered() {
      if (!this.search) return this.users;
      const q = this.search.toLowerCase();
      return this.users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    },
  },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      const res = await TMA.get("/api/admin/users");
      this.users = res.users;
    },
    async toggleActive(u) {
      await TMA.put(`/api/admin/users/${u.id}/status`, { is_active: !u.is_active });
      await this.load();
    },
    async toggleBlacklist(u) {
      const verb = u.is_blacklisted ? "remove the blacklist for" : "blacklist";
      if (!confirm(`Are you sure you want to ${verb} "${u.name}"?`)) return;
      await TMA.put(`/api/admin/users/${u.id}/status`, { is_blacklisted: !u.is_blacklisted });
      await this.load();
    },
  },
  template: `
    <div>
      <div class="mb-4">
        <div class="section-eyebrow">Community</div>
        <h2 class="mb-0">Trekkers</h2>
      </div>

      <input v-model="search" class="form-control mb-3" style="max-width:320px" placeholder="Search by name or email…">

      <div class="table-responsive">
        <table class="table bg-white align-middle">
          <thead>
            <tr class="text-uppercase small text-muted">
              <th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id">
              <td class="fw-semibold">{{ u.name }}</td>
              <td class="small">{{ u.email }}</td>
              <td class="small">{{ u.phone || '—' }}</td>
              <td>
                <span v-if="u.is_blacklisted" class="badge badge-status status-Closed">Blacklisted</span>
                <span v-else-if="!u.is_active" class="badge badge-status status-Pending">Deactivated</span>
                <span v-else class="badge badge-status status-Open">Active</span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-forest me-1" @click="toggleActive(u)">
                  {{ u.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="toggleBlacklist(u)">
                  {{ u.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}
                </button>
              </td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="5" class="empty-state">No trekkers registered yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
};
