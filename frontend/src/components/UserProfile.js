const UserProfile = {
  data() { return { form: { name: "", phone: "", password: "" }, msg: "", error: "" }; },
  async mounted() {
    const res = await TMA.get("/api/profile");
    this.form.name = res.user.name;
    this.form.phone = res.user.phone || "";
  },
  methods: {
    async save() {
      this.error = ""; this.msg = "";
      try {
        const payload = { name: this.form.name, phone: this.form.phone };
        if (this.form.password) payload.password = this.form.password;
        const res = await TMA.put("/api/profile", payload);
        this.$root.setUser(res.user);
        this.form.password = "";
        this.msg = "Profile updated.";
      } catch (e) { this.error = e.message; }
    },
  },
  template: `
    <div>
      <div class="mb-4">
        <div class="section-eyebrow">Account</div>
        <h2 class="mb-0">My Profile</h2>
      </div>
      <div class="card p-4" style="max-width:480px">
        <div v-if="msg" class="alert alert-success py-2">{{ msg }}</div>
        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
        <div class="mb-3">
          <label class="form-label">Full name</label>
          <input v-model="form.name" class="form-control">
        </div>
        <div class="mb-3">
          <label class="form-label">Phone</label>
          <input v-model="form.phone" class="form-control">
        </div>
        <div class="mb-3">
          <label class="form-label">New password <span class="text-muted small">(leave blank to keep current)</span></label>
          <input v-model="form.password" type="password" class="form-control">
        </div>
        <button class="btn btn-amber" @click="save">Save changes</button>
      </div>
    </div>
  `,
};
