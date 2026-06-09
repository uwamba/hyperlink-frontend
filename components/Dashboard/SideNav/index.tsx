import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import Link from "next/link";

// ─────────────────────────────────────────────
// ROLE CONSTANTS
// ─────────────────────────────────────────────
const ROLES = {
  SUPER_USER: "super_user",        // Admin / Owner       → FULL on everything
  MANAGER: "manager",              // Operation Manager   → MANAGE on most
  FINANCE: "finance",              // Finance/Accountant  → FULL on financial modules
  TECHNICAL_SUPPORT: "technical_support", // Technical Support → owns tickets/jobs
  TECHNICIAN: "technician",        // Field Technician    → assigned work only
  SALES_MANAGER: "sales_manager",  // Sales Manager       → sales pipeline
  SALES: "sales",                  // Salesperson         → own clients/leads
};

// ─────────────────────────────────────────────
// ACCESS HELPERS
// ─────────────────────────────────────────────
const is = (role, ...allowed) => allowed.includes(role);

const canSee = {
  dashboard:         (r) => true,  // all roles
  settings:          (r) => is(r, ROLES.SUPER_USER),
  reports:           (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  clients:           (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  plans:             (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  pettycashFloats:   (r) => true,  // all roles can request
  subscriptions:     (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  invoices:          (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.SALES_MANAGER, ROLES.SALES),
  payments:          (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.SALES_MANAGER, ROLES.SALES),
  stock:             (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  jobs:              (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  supports:          (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  expenses:          (r) => true,  // all roles can request
  suppliers:         (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT),
  assets:            (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN),
  userManagement:    (r) => is(r, ROLES.SUPER_USER, ROLES.SALES_MANAGER),  // Sales Manager: VIEW only
  purchases:         (r) => true,  // all roles can submit requests
  delivery:          (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES),
  chat:              (r) => is(r, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN),
};

// ─────────────────────────────────────────────
// SUB-ITEM ACCESS  (label, href, roles[])
// ─────────────────────────────────────────────
const reportItems = (role) => {
  const items = [];
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.SALES_MANAGER)) items.push({ label: "Purchases", href: "/admin/report/purchases" });
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE))                       items.push({ label: "Expenses",  href: "/admin/report/expenses"  });
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.SALES_MANAGER, ROLES.SALES)) items.push({ label: "Sales", href: "/admin/report/sales" });
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN)) items.push({ label: "Stock", href: "/admin/report/stock" });
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.SALES_MANAGER))                items.push({ label: "Users Performance", href: "/admin/report/performance" });
  return items;
};

const clientItems = (role) => {
  const canAdd  = is(role, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.SALES_MANAGER, ROLES.SALES);
  const canList = true;
  return [
    canList && { label: "List",    href: "/admin/clients/list" },
    canAdd  && { label: "Add New", href: "/admin/clients/add" },
  ].filter(Boolean);
};

const stockItems = (role) => {
  const canManage  = is(role, ROLES.SUPER_USER, ROLES.MANAGER);
  const canRequest = is(role, ROLES.TECHNICAL_SUPPORT, ROLES.TECHNICIAN, ROLES.SALES_MANAGER, ROLES.SALES);
  const viewOnly   = is(role, ROLES.FINANCE);
  const items = [];
  if (canManage) {
    items.push({ label: "Add Product",      href: "/admin/stock/products/add"  });
    items.push({ label: "List Products",    href: "/admin/stock/products/list" });
    items.push({ label: "Delivered Stock",  href: "/admin/stock/stock_out"     });
    items.push({ label: "Stock",            href: "/admin/stock/stock_in"      });
    items.push({ label: "New Stock",        href: "/admin/stock/new_stock"     });
  } else if (viewOnly) {
    items.push({ label: "View Stock Value", href: "/admin/stock/stock_in"      });
  } else if (canRequest) {
    items.push({ label: "Request Stock",    href: "/admin/stock/request"       });
    if (is(role, ROLES.TECHNICIAN)) {
      items.push({ label: "Update Issued Items", href: "/admin/stock/update_issued" });
    }
  }
  return items;
};

const jobItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER)) {
    return [
      { label: "List",    href: "/admin/jobs/list" },
      { label: "Add New", href: "/admin/jobs/add"  },
    ];
  }
  if (is(role, ROLES.TECHNICAL_SUPPORT)) {
    return [
      { label: "My Support Jobs", href: "/admin/jobs/list" },
      { label: "Add New",         href: "/admin/jobs/add"  },
    ];
  }
  if (is(role, ROLES.TECHNICIAN)) {
    return [{ label: "My Assigned Jobs", href: "/admin/jobs/list" }];
  }
  if (is(role, ROLES.SALES_MANAGER, ROLES.SALES)) {
    return [{ label: "Client Follow-up Jobs", href: "/admin/jobs/list" }];
  }
  if (is(role, ROLES.FINANCE)) {
    return [{ label: "View Cost", href: "/admin/jobs/list" }];
  }
  return [];
};

const supportsItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.TECHNICAL_SUPPORT)) {
    return [
      { label: "List",    href: "/admin/supports/list" },
      { label: "Add New", href: "/admin/supports/add"  },
    ];
  }
  if (is(role, ROLES.MANAGER)) {
    return [
      { label: "List (Escalations)", href: "/admin/supports/list" },
    ];
  }
  if (is(role, ROLES.TECHNICIAN)) {
    return [{ label: "My Assigned Tickets", href: "/admin/supports/list" }];
  }
  if (is(role, ROLES.SALES_MANAGER, ROLES.SALES)) {
    return [
      { label: "Client Issues", href: "/admin/supports/list" },
      { label: "Create Request", href: "/admin/supports/add" },
    ];
  }
  return [];
};

const invoiceItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.FINANCE)) {
    return [
      { label: "Overdue Invoices", href: "/admin/invoices/overdue" },
      { label: "Paid Invoices",    href: "/admin/invoices/paid"    },
      { label: "Unpaid Invoices",  href: "/admin/invoices/unpaid"  },
    ];
  }
  // Manager, Sales Manager, Sales → VIEW only
  return [
    { label: "Overdue Invoices", href: "/admin/invoices/overdue" },
    { label: "Paid Invoices",    href: "/admin/invoices/paid"    },
    { label: "Unpaid Invoices",  href: "/admin/invoices/unpaid"  },
  ];
};

const paymentItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.FINANCE)) {
    return [
      { label: "List",             href: "/admin/payments/list"   },
      { label: "Approve Payment",  href: "/admin/invoices/unpaid" },
    ];
  }
  // Manager, Sales, Sales Manager → view status only
  return [{ label: "Payment Status", href: "/admin/payments/list" }];
};

const floatItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.FINANCE)) {
    return [
      { label: "List",         href: "/admin/float/list"    },
      { label: "Approve",      href: "/admin/float/approve" },
      { label: "Add Request",  href: "/admin/float/request" },
    ];
  }
  if (is(role, ROLES.MANAGER)) {
    return [
      { label: "List",        href: "/admin/float/list"    },
      { label: "Add Request", href: "/admin/float/request" },
    ];
  }
  // All other roles → request only
  return [{ label: "Add Request", href: "/admin/float/request" }];
};

const expenseItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.FINANCE)) {
    return [
      { label: "List",         href: "/admin/expense/list"    },
      { label: "Approve",      href: "/admin/expense/approve" },
      { label: "Add New",      href: "/admin/expense/add"     },
    ];
  }
  if (is(role, ROLES.MANAGER)) {
    return [
      { label: "List",    href: "/admin/expense/list" },
      { label: "Add New", href: "/admin/expense/add"  },
    ];
  }
  return [{ label: "Add Request", href: "/admin/expense/add" }];
};

const supplierItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.FINANCE)) {
    return [
      { label: "List",    href: "/admin/suppliers/list" },
      { label: "Add New", href: "/admin/suppliers/add"  },
    ];
  }
  if (is(role, ROLES.MANAGER)) {
    return [
      { label: "List",    href: "/admin/suppliers/list" },
      { label: "Add New", href: "/admin/suppliers/add"  },
    ];
  }
  // Technical Support → view tech suppliers only
  return [{ label: "View Tech Suppliers", href: "/admin/suppliers/list" }];
};

const assetItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER)) {
    return [
      { label: "List Assets",    href: "/admin/assets/list" },
      { label: "Add New Asset",  href: "/admin/assets/add"  },
    ];
  }
  if (is(role, ROLES.TECHNICAL_SUPPORT)) {
    return [
      { label: "Manage Tech Assets", href: "/admin/assets/list" },
      { label: "Add Tech Asset",     href: "/admin/assets/add"  },
    ];
  }
  if (is(role, ROLES.TECHNICIAN)) {
    return [{ label: "My Assigned Equipment", href: "/admin/assets/list" }];
  }
  // Finance → view value/depreciation
  return [{ label: "View Asset Values", href: "/admin/assets/list" }];
};

const userMgmtItems = (role) => {
  if (is(role, ROLES.SUPER_USER)) {
    return [
      { label: "List Users",    href: "/admin/user/list" },
      { label: "Add New User",  href: "/admin/user/add"  },
    ];
  }
  // Sales Manager → view sales team only
  return [{ label: "View Sales Team", href: "/admin/user/list" }];
};

const purchaseItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.FINANCE)) {
    return [
      { label: "List",              href: "/admin/purchases/list" },
      { label: "Add New Purchase",  href: "/admin/purchases/add"  },
      { label: "Process Payment",   href: "/admin/purchases/pay"  },
    ];
  }
  if (is(role, ROLES.MANAGER)) {
    return [
      { label: "List",             href: "/admin/purchases/list" },
      { label: "Review Requests",  href: "/admin/purchases/review" },
    ];
  }
  return [{ label: "Submit Request", href: "/admin/purchases/add" }];
};

const deliveryItems = (role) => {
  if (is(role, ROLES.SUPER_USER, ROLES.MANAGER)) {
    return [
      { label: "List",                 href: "/admin/delivery_note/list" },
      { label: "Create New Delivery",  href: "/admin/delivery_note/add"  },
    ];
  }
  if (is(role, ROLES.TECHNICIAN)) {
    return [{ label: "Update Delivery / Installation", href: "/admin/delivery_note/list" }];
  }
  if (is(role, ROLES.SALES_MANAGER, ROLES.SALES)) {
    return [{ label: "Client Delivery Status", href: "/admin/delivery_note/list" }];
  }
  // Finance → view cost/status
  return [{ label: "Delivery Cost & Status", href: "/admin/delivery_note/list" }];
};

// ─────────────────────────────────────────────
// REUSABLE COLLAPSIBLE NAV ITEM
// Uses a ref to measure real content height so items are never clipped.
// The panel only collapses when the header button is clicked — not on
// child link clicks or any other event.
// ─────────────────────────────────────────────
const NavGroup = ({ label, isOpen, toggle, items }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  // Recalculate whenever items change or panel opens/closes
  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, items]);

  return (
    <li>
      {/* Clicking ONLY this button toggles the panel */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // prevent any parent handlers
          toggle();
        }}
        className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
      >
        <span className="flex items-center justify-between">
          <span>{label}</span>
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          />
        </span>
      </button>

      {/* Height animates from 0 → real content height; overflow hidden only while animating */}
      <ul
        ref={contentRef}
        style={{
          maxHeight: isOpen ? `${height}px` : "0px",
          overflow: "hidden",
          transition: "max-height 350ms ease-in-out",
        }}
        className="ml-6 space-y-2 mt-1"
      >
        {items.map(({ label: itemLabel, href }) => (
          <li key={href}>
            <Link href={href}>
              {/* e.stopPropagation so clicking a link never bubbles up to the toggle button */}
              <span
                onClick={(e) => e.stopPropagation()}
                className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out cursor-pointer"
              >
                {itemLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
};

// ─────────────────────────────────────────────
// ROLE BADGE  (visual indicator in nav header)
// ─────────────────────────────────────────────
const ROLE_LABELS = {
  super_user:        { label: "Admin",            color: "bg-red-600"    },
  manager:           { label: "Ops Manager",      color: "bg-blue-600"   },
  finance:           { label: "Finance",          color: "bg-green-600"  },
  technical_support: { label: "Tech Support",     color: "bg-yellow-600" },
  technician:        { label: "Technician",       color: "bg-orange-600" },
  sales_manager:     { label: "Sales Manager",    color: "bg-purple-600" },
  sales:             { label: "Sales",            color: "bg-pink-600"   },
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const SideNav = () => {
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown states
  const [open, setOpen] = useState({
    reports: false, clients: false, plans: false, floats: false,
    subscriptions: false, invoices: false, payments: false, stock: false,
    jobs: false, supports: false, expenses: false, suppliers: false,
    assets: false, users: false, purchases: false, delivery: false,
  });

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    if (userData?.role) setUserRole(userData.role);
  }, []);

  const matchesSearch = (text) =>
    text.toLowerCase().includes(searchQuery.toLowerCase());

  const roleBadge = ROLE_LABELS[userRole];

  // Helper: render a NavGroup only if the role can see it AND search matches
  const Group = ({ seeKey, label, openKey, items }) => {
    if (!canSee[seeKey]?.(userRole)) return null;
    if (searchQuery && !matchesSearch(label)) return null;
    if (!items || items.length === 0) return null;
    return (
      <NavGroup
        label={label}
        isOpen={open[openKey]}
        toggle={() => toggle(openKey)}
        items={items}
      />
    );
  };

  return (
    <nav className="w-64 bg-gray-800 text-white h-screen p-4 overflow-y-auto">

      {/* Role badge */}
      {roleBadge && (
        <div className="mb-3 flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ul className="space-y-4">

        {/* Dashboard — all roles */}
        {(!searchQuery || matchesSearch("Dashboard")) && (
          <li>
            <Link href="/admin/dashboard">
              <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">
                Dashboard
              </span>
            </Link>
          </li>
        )}

        {/* Settings — super_user only */}
        {canSee.settings(userRole) && (!searchQuery || matchesSearch("Settings")) && (
          <li>
            <Link href="/admin/settings">
              <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">
                Settings
              </span>
            </Link>
          </li>
        )}

        {/* Reports */}
        <Group
          seeKey="reports" label="Reports" openKey="reports"
          items={reportItems(userRole)}
        />

        {/* Clients */}
        <Group
          seeKey="clients" label="Clients" openKey="clients"
          items={clientItems(userRole)}
        />

        {/* Chat — super_user, manager, technical_support, technician */}
        {canSee.chat(userRole) && (!searchQuery || matchesSearch("Chat Sessions")) && (
          <li>
            <Link href="/admin/chat">
              <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">
                💬 Chat Sessions
              </span>
            </Link>
          </li>
        )}

        {/* Plans — all roles can view; only super_user/manager can manage */}
        {canSee.plans(userRole) && (!searchQuery || matchesSearch("Plans")) && (
          <NavGroup
            label="Plans"
            isOpen={open.plans}
            toggle={() => toggle("plans")}
            items={
              is(userRole, ROLES.SUPER_USER, ROLES.MANAGER)
                ? [
                    { label: "List",    href: "/admin/plans/list" },
                    { label: "Add New", href: "/admin/plans/add"  },
                  ]
                : [{ label: "View Plans", href: "/admin/plans/list" }]
            }
          />
        )}

        {/* Pettycash Floats — all roles */}
        {canSee.pettycashFloats(userRole) && (!searchQuery || matchesSearch("Pettycash Floats")) && (
          <NavGroup
            label="Pettycash Floats"
            isOpen={open.floats}
            toggle={() => toggle("floats")}
            items={floatItems(userRole)}
          />
        )}

        {/* Subscriptions */}
        {canSee.subscriptions(userRole) && (!searchQuery || matchesSearch("Subscriptions")) && (
          <NavGroup
            label="Subscriptions"
            isOpen={open.subscriptions}
            toggle={() => toggle("subscriptions")}
            items={
              is(userRole, ROLES.SUPER_USER, ROLES.MANAGER, ROLES.FINANCE, ROLES.SALES_MANAGER)
                ? [
                    { label: "List",    href: "/admin/subscriptions/list" },
                    { label: "Add New", href: "/admin/subscriptions/add"  },
                  ]
                : [{ label: "View Status", href: "/admin/subscriptions/list" }]
            }
          />
        )}

        {/* Invoices */}
        <Group
          seeKey="invoices" label="Invoices" openKey="invoices"
          items={invoiceItems(userRole)}
        />

        {/* Payments */}
        <Group
          seeKey="payments" label="Payments" openKey="payments"
          items={paymentItems(userRole)}
        />

        {/* Stock Management */}
        <Group
          seeKey="stock" label="Stock Management" openKey="stock"
          items={stockItems(userRole)}
        />

        {/* Jobs */}
        <Group
          seeKey="jobs" label="Jobs" openKey="jobs"
          items={jobItems(userRole)}
        />

        {/* Supports */}
        <Group
          seeKey="supports" label="Supports" openKey="supports"
          items={supportsItems(userRole)}
        />

        {/* Expenses */}
        {canSee.expenses(userRole) && (!searchQuery || matchesSearch("Expenses")) && (
          <NavGroup
            label="Expenses"
            isOpen={open.expenses}
            toggle={() => toggle("expenses")}
            items={expenseItems(userRole)}
          />
        )}

        {/* Suppliers */}
        <Group
          seeKey="suppliers" label="Suppliers" openKey="suppliers"
          items={supplierItems(userRole)}
        />

        {/* Asset Management */}
        <Group
          seeKey="assets" label="Asset Management" openKey="assets"
          items={assetItems(userRole)}
        />

        {/* User Management — super_user + sales_manager (view-only) */}
        <Group
          seeKey="userManagement" label="User Management" openKey="users"
          items={userMgmtItems(userRole)}
        />

        {/* Purchase Management */}
        {canSee.purchases(userRole) && (!searchQuery || matchesSearch("Purchase Management")) && (
          <NavGroup
            label="Purchase Management"
            isOpen={open.purchases}
            toggle={() => toggle("purchases")}
            items={purchaseItems(userRole)}
          />
        )}

        {/* Delivery Management */}
        <Group
          seeKey="delivery" label="Delivery Management" openKey="delivery"
          items={deliveryItems(userRole)}
        />

      </ul>
    </nav>
  );
};

export default SideNav;