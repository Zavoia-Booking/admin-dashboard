// Shared data + i18n for the reconciliation prototype.
// Exposes: window.ZVData (members, appointments, helpers) and window.ZVI18n (t, lang).

(function () {
  const AVATAR_COLORS = [
    '#C94A2A', '#7B6CB8', '#3F8C6A', '#C58A2D', '#1F6FA8',
    '#A04565', '#4A6E8C', '#8C4530', '#5D7A2E', '#9C5A8E',
  ];

  const initials = (name) =>
    name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  // 7 team members. The current user wants to drop down to 5 paid seats,
  // so 2 must be removed. Members listed in seat-assignment order; the
  // newest two are the natural candidates but the user can pick any.
  const TEAM = [
    { id: 'm-elena',    name: 'Elena Marinescu',   role: 'Owner · Stylist',     joined: '2022-02-14', appts: 0,  avatar: 0, you: true,  pinned: true },
    { id: 'm-andrei',   name: 'Andrei Popescu',    role: 'Senior Stylist',      joined: '2022-04-03', appts: 14, avatar: 1 },
    { id: 'm-ioana',    name: 'Ioana Dumitrescu',  role: 'Colorist',            joined: '2022-09-20', appts: 11, avatar: 2 },
    { id: 'm-sorin',    name: 'Sorin Vlad',        role: 'Barber',              joined: '2023-03-11', appts: 9,  avatar: 3 },
    { id: 'm-mihaela',  name: 'Mihaela Ardelean',  role: 'Aesthetician',        joined: '2023-08-02', appts: 8,  avatar: 4 },
    { id: 'm-tudor',    name: 'Tudor Constantin',  role: 'Massage therapist',   joined: '2024-11-17', appts: 6,  avatar: 5 },
    { id: 'm-radu',     name: 'Radu Iliescu',      role: 'Apprentice stylist',  joined: '2025-09-08', appts: 4,  avatar: 6 },
  ].map(m => ({ ...m, initials: initials(m.name), color: AVATAR_COLORS[m.avatar] }));

  // Build appointments. Each owner has a set in the next 14 days.
  // We hand-author so the UI always feels real and varied.
  const SERVICES = {
    stylist: [
      { name: 'Haircut & blow dry', dur: 60, price: 180 },
      { name: 'Trim',                dur: 30, price: 90 },
      { name: 'Bridal styling',      dur: 120, price: 380 },
      { name: 'Men\u2019s cut',       dur: 45, price: 110 },
    ],
    colorist: [
      { name: 'Full highlights',  dur: 150, price: 540 },
      { name: 'Root touch-up',    dur: 75,  price: 240 },
      { name: 'Balayage',         dur: 180, price: 680 },
      { name: 'Toner + gloss',    dur: 60,  price: 200 },
    ],
    barber: [
      { name: 'Beard trim',          dur: 30, price: 70 },
      { name: 'Cut + beard combo',   dur: 60, price: 150 },
      { name: 'Hot towel shave',     dur: 45, price: 130 },
    ],
    aesthetician: [
      { name: 'Signature facial',  dur: 75, price: 280 },
      { name: 'Brow shaping',      dur: 30, price: 80 },
      { name: 'Lash lift',         dur: 60, price: 220 },
    ],
    massage: [
      { name: 'Deep tissue · 60min', dur: 60, price: 240 },
      { name: 'Swedish · 90min',     dur: 90, price: 320 },
      { name: 'Sports recovery',     dur: 60, price: 260 },
    ],
    apprentice: [
      { name: 'Wash & blow dry', dur: 45, price: 70 },
      { name: 'Trim',            dur: 30, price: 60 },
    ],
  };

  const CLIENTS = [
    { name: 'Andreea Vasilescu', phone: '0740 221 884', vip: true },
    { name: 'Maria Stoica',      phone: '0722 198 003' },
    { name: 'Cosmin R\u0103ducanu',     phone: '0744 552 119' },
    { name: 'Diana T\u0103nase',     phone: '0731 776 220' },
    { name: 'Bianca Ionescu',    phone: '0768 339 401', vip: true },
    { name: 'Vlad Marin',        phone: '0723 884 661' },
    { name: 'Smaranda Pop',      phone: '0741 220 507' },
    { name: 'Octavian Ciobanu',  phone: '0769 442 110' },
    { name: 'Larisa Enache',     phone: '0738 661 224' },
    { name: 'Ruxandra Mihai',    phone: '0726 117 889', vip: true },
    { name: 'Daniel Pre\u0219',       phone: '0743 990 552' },
    { name: 'Carmen Niculae',    phone: '0721 308 776' },
    { name: 'Tudor Negrescu',    phone: '0749 117 003' },
    { name: 'Iulia Bratu',       phone: '0762 884 220' },
    { name: 'Robert Pintilie',   phone: '0731 220 998' },
    { name: 'Anca Dr\u0103gan',      phone: '0768 552 117' },
    { name: 'Cristian Voicu',    phone: '0744 117 663' },
    { name: 'Roxana Dr\u0103ghici',  phone: '0722 998 117' },
  ];

  // Seeded RNG so sample data is stable across reloads.
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const today = new Date('2026-05-06T08:00:00');
  const fmtDateKey = (d) => d.toISOString().slice(0, 10);

  function buildAppointments() {
    const rng = mulberry32(7);
    const out = [];
    let id = 1;

    const memberServices = {
      'm-andrei': SERVICES.stylist,
      'm-ioana':  SERVICES.colorist,
      'm-sorin':  SERVICES.barber,
      'm-mihaela': SERVICES.aesthetician,
      'm-tudor':  SERVICES.massage,
      'm-radu':   SERVICES.apprentice,
    };

    // Build a per-service "who else can do this" map. Mirrors the backend
    // eligibleStaffMap[serviceId-locationId] returned from /offboard-preview.
    // We key by service name for prototype-simplicity. Some services have
    // many capable staff; some only one; some none (forces cancel).
    const ELIGIBILITY_BY_SERVICE = {
      // stylist services
      'Haircut & blow dry': ['m-andrei', 'm-elena', 'm-radu'],
      'Trim':                ['m-andrei', 'm-elena', 'm-radu'],
      'Bridal styling':      ['m-andrei', 'm-elena'],
      'Men\u2019s cut':       ['m-andrei', 'm-sorin'],
      // colorist services — niche
      'Full highlights':     ['m-ioana'],
      'Root touch-up':       ['m-ioana', 'm-elena'],
      'Balayage':            ['m-ioana'],
      'Toner + gloss':       ['m-ioana', 'm-elena'],
      // barber
      'Beard trim':          ['m-sorin'],
      'Cut + beard combo':   ['m-sorin', 'm-andrei'],
      'Hot towel shave':     ['m-sorin'],
      // aesthetician
      'Signature facial':    ['m-mihaela'],
      'Brow shaping':        ['m-mihaela', 'm-elena'],
      'Lash lift':           ['m-mihaela'],
      // massage
      'Deep tissue \u00b7 60min': ['m-tudor'],
      'Swedish \u00b7 90min':     ['m-tudor'],
      'Sports recovery':         ['m-tudor'],
      // apprentice
      'Wash & blow dry':     ['m-radu', 'm-andrei', 'm-elena'],
    };

    TEAM.filter(m => !m.you).forEach((m) => {
      const services = memberServices[m.id];
      const wanted = m.appts;
      let added = 0;
      let dayOffset = 0;
      while (added < wanted && dayOffset < 14) {
        const dayDate = new Date(today.getTime() + dayOffset * 86400000);
        const slotsToday = Math.min(2, wanted - added, Math.floor(rng() * 3));
        for (let s = 0; s < slotsToday; s++) {
          const svc = services[Math.floor(rng() * services.length)];
          const client = CLIENTS[Math.floor(rng() * CLIENTS.length)];
          const hour = 9 + Math.floor(rng() * 9);
          const min = [0, 15, 30, 45][Math.floor(rng() * 4)];
          const start = new Date(dayDate);
          start.setHours(hour, min, 0, 0);
          const eligible = (ELIGIBILITY_BY_SERVICE[svc.name] || [m.id]).filter(eid => eid !== m.id);
          out.push({
            id: 'a-' + id++,
            ownerId: m.id,
            client: client.name,
            clientPhone: client.phone,
            vip: !!client.vip,
            service: svc.name,
            duration: svc.dur,
            price: svc.price,
            start: start.toISOString(),
            day: fmtDateKey(start),
            recurring: rng() < 0.12,
            notes: rng() < 0.18 ? (rng() < 0.5 ? 'First visit' : 'Allergic to ammonia') : null,
            // Pool of staff who could take this over (excluding the current owner).
            // Backend equivalent: eligibleStaffMap[serviceId-locationId].
            eligibleStaff: eligible,
          });
          added++;
          if (added >= wanted) break;
        }
        dayOffset++;
      }
    });

    return out.sort((a, b) => a.start.localeCompare(b.start));
  }

  const APPTS = buildAppointments();

  // ─── i18n ──────────────────────────────────────────────────────────────
  const STRINGS = {
    en: {
      appName: 'Zavoia',
      // headers & intro
      flowEyebrow: 'Plan change',
      flowTitle: 'Reconcile your team with your new plan',
      flowSub: 'You\u2019re moving from 7 seats to 5. Choose 2 team members to remove, then decide what happens to their upcoming appointments.',
      // step labels
      stepSelect: 'Select members',
      stepReassign: 'Handle appointments',
      stepReview: 'Review & confirm',
      // members panel
      membersTitle: 'Team members',
      membersOver: 'over',
      membersPaid: 'paid seats',
      membersHint: 'Select {n, plural, one {# member} other {# members}} to remove.',
      membersHintZero: 'Select members to remove from the workspace.',
      memberYou: 'You',
      memberSinceLabel: 'Joined',
      memberApptsLabel: '{n, plural, one {# upcoming} other {# upcoming}}',
      memberOwnerWarn: 'Workspace owner — can\u2019t be removed',
      // appointments panel
      apptsTitle: 'Upcoming appointments',
      apptsSub: '{n} appointments across the next 14 days need a decision.',
      apptsEmpty: 'Pick a member on the left to handle their appointments.',
      apptsAllSet: 'All appointments handled. Ready to review.',
      apptsSearch: 'Search by client, service\u2026',
      bulkReassign: 'Reassign all to\u2026',
      bulkCancel: 'Cancel all',
      bulkReschedule: 'Reschedule all',
      // actions
      actReassign: 'Reassign',
      actCancel: 'Cancel',
      actReschedule: 'Reschedule',
      actNotify: 'Notify client',
      actUndo: 'Undo',
      assignedTo: 'Reassigned to',
      cancelled: 'Cancelled',
      rescheduled: 'Marked to reschedule',
      // chips
      chipRecurring: 'Recurring',
      chipFirstVisit: 'First visit',
      chipVip: 'VIP',
      // review
      reviewTitle: 'Review the changes',
      reviewSub: 'Once you confirm, members lose access immediately, appointments are reassigned and clients are notified by email.',
      reviewRemoving: 'Removing from workspace',
      reviewReassign: 'Reassigning',
      reviewCancel: 'Cancelling',
      reviewReschedule: 'Rescheduling',
      reviewBilling: 'Billing impact',
      reviewBillingDesc: 'You\u2019ll save {amount}/month starting next billing cycle on {date}.',
      // email preview
      emailTitle: 'Email preview',
      emailToMember: 'To removed members',
      emailToClient: 'To affected clients',
      emailSubjMember: 'Update about your access to {studio}',
      emailSubjClient: 'Small update to your appointment',
      emailGreet: 'Hi {name},',
      emailBodyMember: 'Your access to {studio} on Zavoia will end on {date}. Your upcoming appointments have been reassigned to other team members \u2014 you don\u2019t need to do anything. Thank you for the work you\u2019ve done with us.',
      emailBodyClient: 'Your appointment on {date} has been reassigned to {newOwner}, who is looking forward to meeting you. The time, service and price stay the same. Need to change anything? Just reply to this email or call us.',
      emailSignoff: 'Warmly,\nThe {studio} team',
      // buttons
      btnBack: 'Back',
      btnNext: 'Continue',
      btnCancel: 'Cancel',
      btnConfirm: 'Confirm changes',
      btnSave: 'Save reconciliation',
      btnAddSeat: 'Or keep everyone — add a seat',
      // misc
      and: 'and',
      otherMembers: 'other team members',
      pickMember: 'Pick a team member',
      keepUnassigned: 'Leave unassigned',
      // confirm dialogs
      confirmCancelTitle: 'Cancel this appointment?',
      confirmCancelDesc: '{client} will be emailed that the appointment is cancelled. This can\u2019t be undone after you save.',
      keep: 'Keep',
      remove: 'Remove',
      removeFromTeam: 'Remove from team',
      undoRemove: 'Undo',
      // pricing footer
      summarySeats: 'Paid seats',
      summarySaving: 'Monthly savings',
      summaryEffective: 'Effective',
      summaryNextCycle: 'Next billing cycle',
    },
    ro: {
      appName: 'Zavoia',
      flowEyebrow: 'Schimbare plan',
      flowTitle: 'Aliniaz\u0103 echipa cu noul plan',
      flowSub: 'Treci de la 7 locuri la 5. Alege 2 membri pe care \u00ee\u0163i sco\u0163i din workspace, apoi decide ce se \u00eent\u00e2mpl\u0103 cu programarile lor.',
      stepSelect: 'Selecteaz\u0103 membrii',
      stepReassign: 'Reasigneaz\u0103 program\u0103rile',
      stepReview: 'Verific\u0103 \u015fi confirm\u0103',
      membersTitle: 'Membri echip\u0103',
      membersOver: 'peste',
      membersPaid: 'locuri pl\u0103tite',
      membersHint: 'Selecteaz\u0103 {n, plural, one {# membru} other {# membri}} de scos din echip\u0103.',
      membersHintZero: 'Selecteaz\u0103 membrii pe care vrei s\u0103-i sco\u0163i din workspace.',
      memberYou: 'Tu',
      memberSinceLabel: 'Din',
      memberApptsLabel: '{n, plural, one {# program\u0103ri viitoare} other {# program\u0103ri viitoare}}',
      memberOwnerWarn: 'Proprietar workspace \u2014 nu poate fi scos',
      apptsTitle: 'Program\u0103ri viitoare',
      apptsSub: '{n} program\u0103ri \u00een urm\u0103toarele 14 zile au nevoie de o decizie.',
      apptsEmpty: 'Alege un membru \u00een st\u00e2nga ca s\u0103 reasignezi program\u0103rile lui.',
      apptsAllSet: 'Toate program\u0103rile au fost rezolvate. Po\u0163i trece la verificare.',
      apptsSearch: 'Caut\u0103 dup\u0103 client, serviciu\u2026',
      bulkReassign: 'Reasigneaz\u0103 toate c\u0103tre\u2026',
      bulkCancel: 'Anuleaz\u0103 toate',
      bulkReschedule: 'Reprogrameaz\u0103 toate',
      actReassign: 'Reasigneaz\u0103',
      actCancel: 'Anuleaz\u0103',
      actReschedule: 'Reprogrameaz\u0103',
      actNotify: 'Anun\u0163\u0103 clientul',
      actUndo: 'Anuleaz\u0103 ac\u0163iunea',
      assignedTo: 'Reasignat lui',
      cancelled: 'Anulat',
      rescheduled: 'Marcat pentru reprogramare',
      chipRecurring: 'Recurent',
      chipFirstVisit: 'Prim\u0103 vizit\u0103',
      chipVip: 'VIP',
      reviewTitle: 'Verific\u0103 modific\u0103rile',
      reviewSub: 'C\u00e2nd confirmi: membrii pierd accesul imediat, program\u0103rile se reasigneaz\u0103 \u015fi clien\u0163ii sunt anun\u0163a\u0163i pe email.',
      reviewRemoving: 'Scoatem din workspace',
      reviewReassign: 'Reasign\u0103m',
      reviewCancel: 'Anul\u0103m',
      reviewReschedule: 'Reprogram\u0103m',
      reviewBilling: 'Impact pe facturare',
      reviewBillingDesc: 'Economise\u015fti {amount}/lun\u0103 \u00eencep\u00e2nd cu urm\u0103torul ciclu, pe {date}.',
      emailTitle: 'Previzualizare email',
      emailToMember: 'C\u0103tre membrii sco\u015fi',
      emailToClient: 'C\u0103tre clien\u0163ii afecta\u0163i',
      emailSubjMember: 'Actualizare despre accesul t\u0103u la {studio}',
      emailSubjClient: 'O mic\u0103 actualizare despre programarea ta',
      emailGreet: 'Bun\u0103 {name},',
      emailBodyMember: 'Accesul t\u0103u la {studio} pe Zavoia se \u00eencheie pe {date}. Program\u0103rile viitoare au fost deja reasignate altor colegi \u2014 nu trebuie s\u0103 faci nimic. Mul\u0163umim pentru munca ta cu noi.',
      emailBodyClient: 'Programarea ta din {date} a fost preluat\u0103 de {newOwner}, care abia a\u015fteapt\u0103 s\u0103 te cunoasc\u0103. Ora, serviciul \u015fi pre\u0163ul r\u0103m\u00e2n la fel. Vrei s\u0103 schimbi ceva? R\u0103spunde acestui email sau sun\u0103-ne.',
      emailSignoff: 'Cu drag,\nEchipa {studio}',
      btnBack: '\u00cenapoi',
      btnNext: 'Continu\u0103',
      btnCancel: 'Renun\u0163\u0103',
      btnConfirm: 'Confirm\u0103 modific\u0103rile',
      btnSave: 'Salveaz\u0103 reconcilierea',
      btnAddSeat: 'Sau \u0163ine pe toat\u0103 lumea \u2014 adaug\u0103 un loc',
      and: '\u015fi',
      otherMembers: 'al\u0163i membri',
      pickMember: 'Alege un membru',
      keepUnassigned: 'Las\u0103 neasignat',
      confirmCancelTitle: 'Anulezi aceast\u0103 programare?',
      confirmCancelDesc: '{client} va primi un email c\u0103 programarea a fost anulat\u0103. Nu mai poate fi anulat\u0103 dup\u0103 ce salvezi.',
      keep: 'P\u0103streaz\u0103',
      remove: 'Scoate',
      removeFromTeam: 'Scoate din echip\u0103',
      undoRemove: 'Anuleaz\u0103',
      summarySeats: 'Locuri pl\u0103tite',
      summarySaving: 'Economie lunar\u0103',
      summaryEffective: 'Activ',
      summaryNextCycle: 'Urm\u0103torul ciclu de facturare',
    },
  };

  // Tiny formatter — supports {var} and {var, plural, one {…} other {…}}.
  function format(str, vars) {
    if (!str) return str;
    str = str.replace(/\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g,
      (_, key, one, other) => {
        const n = vars[key];
        const tmpl = (n === 1 ? one : other);
        return tmpl.replace(/#/g, n);
      });
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
  }

  function formatMonthDay(iso, lang) {
    const d = new Date(iso);
    const opts = { day: 'numeric', month: 'long' };
    return d.toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'en-US', opts);
  }
  function formatDayHour(iso, lang) {
    const d = new Date(iso);
    const opts = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-US', opts);
  }
  function formatHour(iso, lang) {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === 'ro' ? 'ro-RO' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }
  function formatWeekday(iso, lang) {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' });
  }
  function formatRelativeDay(iso, lang) {
    const d = new Date(iso);
    d.setHours(0,0,0,0);
    const ref = new Date(today); ref.setHours(0,0,0,0);
    const diff = Math.round((d - ref) / 86400000);
    if (lang === 'ro') {
      if (diff === 0) return 'Azi';
      if (diff === 1) return 'M\u00e2ine';
      if (diff < 7) return d.toLocaleDateString('ro-RO', { weekday: 'long' });
      return d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
    } else {
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Tomorrow';
      if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }
  function formatMoney(n, lang) {
    return (lang === 'ro')
      ? n.toLocaleString('ro-RO') + ' lei'
      : n.toLocaleString('en-US') + ' RON';
  }

  function makeT(lang) {
    return (key, vars) => format(STRINGS[lang][key] ?? STRINGS.en[key] ?? key, vars || {});
  }

  window.ZVData = {
    TEAM,
    APPTS,
    today,
    studioName: 'Atelier Cas\u0103 Veche',
    apptsByOwner(ids) {
      const set = new Set(ids);
      return APPTS.filter(a => set.has(a.ownerId));
    },
    // Given a list of appointments and the set of members that are about to
    // be removed, returns who from the *remaining* team can take over each.
    // Mirrors the FE-side filter described in the spec:
    //   eligibleStaffMap[key].filter(s => !selectedMemberIds.has(s.userId))
    eligibleFor(appt, removedSet) {
      return (appt.eligibleStaff || []).filter(id => !removedSet.has(id));
    },
    // Intersection of eligible staff across many appointments — used by the
    // "Reassign all to…" picker to find safe one-click choices.
    intersectionEligible(appts, removedSet) {
      if (!appts.length) return [];
      let acc = new Set(window.ZVData.eligibleFor(appts[0], removedSet));
      for (let i = 1; i < appts.length; i++) {
        const e = new Set(window.ZVData.eligibleFor(appts[i], removedSet));
        acc = new Set([...acc].filter(x => e.has(x)));
      }
      return Array.from(acc);
    },
    // For a candidate staff id, count how many of the given appointments
    // they could actually take over.
    coverageFor(staffId, appts, removedSet) {
      let n = 0;
      for (const a of appts) {
        if (window.ZVData.eligibleFor(a, removedSet).includes(staffId)) n++;
      }
      return n;
    },
  };
  window.ZVI18n = { STRINGS, makeT, format, formatMonthDay, formatDayHour, formatHour, formatWeekday, formatRelativeDay, formatMoney };
})();
