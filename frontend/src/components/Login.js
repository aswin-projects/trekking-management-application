const Login = {
  components: { Contour },
  data() {
    return { email: "", password: "", error: "", loading: false };
  },
  template: `
    <div class="auth-wrap">
      <Contour />
      <div class="auth-card">
        <div class="text-center mb-4">
          <div class="auth-brand">Basecamp <small>Trekking Management</small></div>
        </div>
        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required autofocus>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required>
          </div>
          <button class="btn btn-amber w-100 fw-semibold py-2" :disabled="loading">
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <div class="text-center mt-3">
          <small class="text-muted">
            New trekker?
            <router-link to="/register">Create an account</router-link>
          </small>
        </div>
        <div class="text-center mt-2">
          <small class="text-muted">
            Are you a trek guide?
            <router-link to="/register-staff">Apply as trek staff</router-link>
          </small>
        </div>
      </div>
    </div>
  `,
  methods: {
    async submit() {
      this.error = "";
      this.loading = true;
      try {
        const res = await TMA.post("/api/auth/login", { email: this.email, password: this.password });
        this.$root.setUser(res.user);
        this.$root.routeAfterLogin();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
};
