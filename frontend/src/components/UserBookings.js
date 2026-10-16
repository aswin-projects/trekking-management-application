const UserBookings = {
  data() { return { bookings: [] }; },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      const res = await TMA.get("/api/bookings/my");
      this.bookings = res.bookings;
    },
    async cancel(b) {
      if (!confirm(`Cancel your booking for "${b.trek_name}"?`)) return;
      await TMA.put(`/api/bookings/${b.id}/cancel`);
      await this.load();
    },
  },
  template: `
    <div>
      <div class="mb-4">
        <div class="section-eyebrow">Your journey</div>
        <h2 class="mb-0">My Bookings</h2>
      </div>

      <div class="table-responsive">
        <table class="table bg-white align-middle">
          <thead>
            <tr class="text-uppercase small text-muted">
              <th>Trek</th><th>Booked on</th><th>Slots</th><th>Status</th><th>Payment</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bookings" :key="b.id">
              <td class="fw-semibold">{{ b.trek_name }}</td>
              <td class="small mono">{{ b.booking_date ? b.booking_date.slice(0,10) : '—' }}</td>
              <td class="mono">{{ b.num_slots }}</td>
              <td><span class="badge badge-status" :class="'status-' + b.status">{{ b.status }}</span></td>
              <td class="small">{{ b.payment_status }}</td>
              <td class="text-end">
                <button v-if="b.status==='Booked'" class="btn btn-sm btn-outline-danger" @click="cancel(b)">Cancel</button>
              </td>
            </tr>
            <tr v-if="!bookings.length"><td colspan="6" class="empty-state">No bookings yet — go explore some treks!</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
};
