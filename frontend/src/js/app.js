const { createApp, ref } = Vue;
const { createRouter, createWebHistory } = VueRouter;

const routes = [
  { path: "/login", component: Login, meta: { guest: true } },
  { path: "/register", component: Register, meta: { guest: true } },
  { path: "/register-staff", component: RegisterStaff, meta: { guest: true } },

  { path: "/admin", component: AdminDashboard, meta: { role: "admin" } },
  { path: "/admin/treks", component: AdminTreks, meta: { role: "admin" } },
  { path: "/admin/staff", component: AdminStaff, meta: { role: "admin" } },
  { path: "/admin/users", component: AdminUsers, meta: { role: "admin" } },

  { path: "/staff", component: StaffDashboard, meta: { role: "staff" } },
  { path: "/staff/treks/:id", component: StaffTrekDetail, meta: { role: "staff" } },

  { path: "/treks", component: UserTreks, meta: { role: "user" } },
  { path: "/bookings", component: UserBookings, meta: { role: "user" } },
  { path: "/profile", component: UserProfile, meta: { role: "user" } },

  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({ history: createWebHistory(), routes });

const homeFor = (role) => (role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/treks");

router.beforeEach((to, from, next) => {
  const user = window.__tmaUser;
  if (!user) {
    return to.meta.guest ? next() : next("/login");
  }
  if (to.meta.guest) return next(homeFor(user.role));
  if (to.meta.role && to.meta.role !== user.role) return next(homeFor(user.role));
  next();
});

const RootApp = {
  components: { NavBar },
  data() {
    return { user: null, ready: false };
  },
  async created() {
    try {
      const res = await TMA.get("/api/auth/me");
      this.setUser(res.user);
    } catch (e) {
      this.setUser(null);
    }
    this.ready = true;
    if (!this.user && !router.currentRoute.value.meta.guest) {
      router.replace("/login");
    }
  },
  methods: {
    setUser(user) {
      this.user = user;
      window.__tmaUser = user;
    },
    routeAfterLogin() {
      router.replace(homeFor(this.user.role));
    },
    async logout() {
      try { await TMA.post("/api/auth/logout"); } catch (e) {}
      this.setUser(null);
      router.replace("/login");
    },
  },
  template: `
    <div v-if="!ready" class="d-flex align-items-center justify-content-center" style="min-height:100vh">
      <div class="text-muted">Loading Basecamp…</div>
    </div>
    <div v-else-if="!user">
      <router-view />
    </div>
    <div v-else class="d-flex tma-shell">
      <NavBar :user="user" @logout="logout" />
      <div class="tma-main">
        <div class="tma-topbar">
          <div class="fw-semibold text-capitalize">{{ user.role }} console</div>
          <div class="small text-muted"><i class="bi bi-cloud-check"></i> Live</div>
        </div>
        <div class="tma-content">
          <router-view />
        </div>
      </div>
    </div>
  `,
};

const app = createApp(RootApp);
app.use(router);
app.mount("#app");
