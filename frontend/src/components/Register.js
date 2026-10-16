const Register = {
  components: { Contour },
  data() {
    return { name: "", email: "", phone: "", password: "", error: "", loading: false };
  },
  template: `
    <div class="auth-wrap">
      <Contour />
      <div class="auth-card">
        <div class="text-center mb-4">
          <div class="auth-brand">Basecamp <small>Join as a trekker</small></div>
        </div>
        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Full name</label>
            <input v-model="name" class="form-control" required autofocus>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Phone</label>
            <input v-model="phone" class="form-control">
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" minlength="6" required>
          </div>
          <button class="btn btn-amber w-100 fw-semibold py-2" :disabled="loading">
            {{ loading ? 'Creating account…' : 'Create account' }}
          </button>
        </form>
        <div class="text-center mt-3">
          <small class="text-muted">
            Already have an account?
            <router-link to="/login">Sign in</router-link>
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
        const res = await TMA.post("/api/auth/register", {
          name: this.name, email: this.email, phone: this.phone, password: this.password,
        });
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
