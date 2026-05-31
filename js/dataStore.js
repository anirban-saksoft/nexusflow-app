/**
 * ============================================================
 *  dataStore.js — NexusFlow Shared In-Memory Data Store
 * ============================================================
 *  Simulates a backend data layer for Projects, Team Members,
 *  and Invoices. Provides CRUD-style API methods.
 *
 *  Imported via <script src="js/dataStore.js"></script>
 * ============================================================
 */

var NexusStore = (function () {

  // ── Projects ─────────────────────────────────────────────
  var projects = [
    { id: "PROJ-001", name: "Website Redesign",  category: "Engineering",  status: "active",  created: "Mar 15, 2026" },
    { id: "PROJ-002", name: "Q2 Campaign",        category: "Marketing",    status: "active",  created: "Mar 22, 2026" },
    { id: "PROJ-003", name: "SOC 2 Compliance",   category: "Operations",   status: "pending", created: "Apr 01, 2026" }
  ];

  // ── Team Members ─────────────────────────────────────────
  var members = [
    { id: "USR-001", name: "Anirban Roy",  email: "anirban@ceptes.com", role: "Admin",   status: "active"  },
    { id: "USR-002", name: "Jane Smith",   email: "jane@acme.com",      role: "Manager", status: "active"  },
    { id: "USR-003", name: "Mike Chen",    email: "mike@acme.com",      role: "Member",  status: "active"  },
    { id: "USR-004", name: "Sara Patel",   email: "sara@acme.com",      role: "Member",  status: "pending" },
    { id: "USR-005", name: "Tom Wilson",   email: "tom@acme.com",       role: "Viewer",  status: "active"  }
  ];

  // ── Invoices ─────────────────────────────────────────────
  var invoices = [
    { id: "INV-0041", client: "Acme Corp",   amount: "$12,500.00", status: "active",   date: "Apr 02, 2026" },
    { id: "INV-0040", client: "Globex Inc",  amount: "$8,750.00",  status: "pending",  date: "Mar 28, 2026" },
    { id: "INV-0039", client: "Initech LLC", amount: "$3,200.00",  status: "inactive", date: "Mar 15, 2026" }
  ];


  // ══════════════════════════════════════════════════════════
  //  PROJECT APIs
  // ══════════════════════════════════════════════════════════

  function getProjects() { return projects.slice(); }

  function addProject(project) {
    if (!project || !project.id) throw new Error("Invalid project object.");
    projects.push(project);
    return project;
  }

  /**
   * deleteProject(id)
   * DELETE /api/projects/:id
   */
  function deleteProject(id) {
    if (!id) throw new Error("Project ID is required for deletion.");
    var index = projects.findIndex(function (p) { return p.id === id; });
    if (index === -1) throw new Error("Project not found: " + id);
    return projects.splice(index, 1)[0];
  }


  // ══════════════════════════════════════════════════════════
  //  TEAM MEMBER APIs
  // ══════════════════════════════════════════════════════════

  function getMembers() { return members.slice(); }

  /**
   * deleteMember(id)
   * DELETE /api/team/:id
   * Guard: Cannot delete the last Admin.
   */
  function deleteMember(id) {
    if (!id) throw new Error("Member ID is required for deletion.");
    var index = members.findIndex(function (m) { return m.id === id; });
    if (index === -1) throw new Error("Member not found: " + id);
    var target = members[index];
    if (target.role === "Admin") {
      var adminCount = members.filter(function (m) { return m.role === "Admin"; }).length;
      if (adminCount <= 1) throw new Error("Cannot delete the last Admin. Assign another Admin first.");
    }
    return members.splice(index, 1)[0];
  }


  // ══════════════════════════════════════════════════════════
  //  INVOICE APIs
  // ══════════════════════════════════════════════════════════

  function getInvoices() { return invoices.slice(); }

  function addInvoice(invoice) {
    if (!invoice || !invoice.id) throw new Error("Invalid invoice object.");
    invoices.push(invoice);
    return invoice;
  }

  /**
   * deleteInvoice(id)
   * DELETE /api/invoices/:id
   * Guard: Cannot delete paid (active) invoices.
   */
  function deleteInvoice(id) {
    if (!id) throw new Error("Invoice ID is required for deletion.");
    var index = invoices.findIndex(function (inv) { return inv.id === id; });
    if (index === -1) throw new Error("Invoice not found: " + id);
    var target = invoices[index];
    if (target.status === "active") throw new Error("Cannot delete a paid invoice: " + id + ". Archive it instead.");
    return invoices.splice(index, 1)[0];
  }


  // ── Public API ────────────────────────────────────────────
  return {
    getProjects:   getProjects,
    addProject:    addProject,
    deleteProject: deleteProject,
    getMembers:    getMembers,
    deleteMember:  deleteMember,
    getInvoices:   getInvoices,
    addInvoice:    addInvoice,
    deleteInvoice: deleteInvoice
  };

})();
