const NavBar = {
  props: { user: Object },
  computed: {
    links() {
      if (this.user.role === "admin") {
        return [
          { to: "/admin", label: "Overview", icon: "bi-speedometer2" },
          { to: "/admin/treks", label: "Treks", icon: "bi-signpost-2" },
          { to: "/admin/staff", label: "Trek Staff", icon: "bi-people" },
          { to: "/admin/users", label: "Trekkers", icon: "bi-person-lines-fill" },
        ];
      }
      if (this.user.role === "staff") {
        return [
          { to: "/staff", label: "My Treks", icon: "bi-map" },
        ];
      }
      return [
        { to: "/treks", label: "Explore Treks", icon: "bi-compass" },
        { to: "/bookings", label: "My Bookings", icon: "bi-journal-check" },
        { to: "/profile", label: "Profile", icon: "bi-person-circle" },
      ];
    },
  },
  template: `
    <aside class="tma-sidebar">
      <div class="brand">Basecamp<small>Trekking Management</small></div>
      <nav class="mt-2">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="nav-link"
          :class="{ active: $route.path === l.to }">
          <i class="bi" :class="l.icon"></i> {{ l.label }}
        </router-link>
      </nav>
      <div class="sidebar-footer">
        Signed in as<br>
        <strong style="color:#fff">{{ user.name }}</strong><br>
        <span class="text-capitalize">{{ user.role }}</span>
        <button class="btn btn-sm btn-outline-light w-100 mt-3" @click="$emit('logout')">
          <i class="bi bi-box-arrow-right"></i> Log out
        </button>
      </div>
    </aside>
  `,
};
