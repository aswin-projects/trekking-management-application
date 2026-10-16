const RegisterStaff = {
  components: { Contour },
  data() {
    return {
      name: "", email: "", phone: "", password: "", contact_details: "", bio: "",
      error: "", success: "", loading: false,
    };
  },
  template: `
    <div class="auth-wrap">
      <Contour />
      <div class="auth-card">
        <div class="text-center mb-4">
          <div class="auth-brand">Basecamp <small>Apply as trek staff</small></div>
        </div>

        <div v-if="success" class="text-center">
          <div class="alert alert-success">{{ success }}</div>
          <router-link to="/login" class="btn btn-outline-forest w-100">Back to sign in</router-link>
        </div>

        <form v-else @submit.prevent="submit">
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
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
          <div class="mb-3">
            <label class="form-label">Guiding experience / bio</label>
            <textarea v-model="bio" class="form-control" rows="2" placeholder="Years guiding, regions covered, certifications…"></textarea>
          </div>
          <div class="alert alert-light border py-2 small">
            Your account will need to be approved by an admin before you can log in and manage treks.
          </div>
          <button class="btn btn-amber w-100 fw-semibold py-2" :disabled="loading">
            {{ loading ? 'Submitting…' : 'Submit application' }}
          </button>
        </form>

        <div class="text-center mt-3" v-if="!success">
          <small class="text-muted">
            <router-link to="/login">Back to sign in</router-link>
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
        const res = await TMA.post("/api/auth/register-staff", {
          name: this.name, email: this.email, phone: this.phone,
          password: this.password, contact_details: this.contact_details || this.phone,
          bio: this.bio,
        });
        this.success = res.message;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
};
