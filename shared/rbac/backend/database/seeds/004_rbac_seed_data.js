'use strict';

/**
 * Baseline RBAC seed (architecture doc §14/§17): the 10 roles from doc
 * Phase 14's table, and a representative permission set covering this
 * submodule (`module = 'Vendors'`) plus the `clm_project*` extension
 * (`module = 'ClientManagement'`). Grants below mirror doc §14's
 * "representative permissions" column exactly, one row per (role, permission).
 */

const ROLES = [
  'Super Admin', 'Admin', 'Project Manager', 'Site Engineer', 'Procurement Manager',
  'Procurement Officer', 'Finance Manager', 'Accountant', 'Management', 'Viewer',
].map((role_name) => ({ role_name }));

const PERMISSIONS = [
  { permission_code: 'clm_project.manage', module: 'ClientManagement', description: 'Create/update/delete projects' },
  { permission_code: 'clm_project.read', module: 'ClientManagement', description: 'Read projects' },
  { permission_code: 'clm_project_cost.manage', module: 'ClientManagement', description: 'Manage a project\'s cost plan' },
  { permission_code: 'clm_project_expense.create', module: 'ClientManagement', description: 'Record a project expense' },
  { permission_code: 'clm_project_expense.approve', module: 'ClientManagement', description: 'Approve/reject a project expense' },
  { permission_code: 'clm_payment.create', module: 'ClientManagement', description: 'Record a client payment' },
  { permission_code: 'vnd_vendor.manage', module: 'Vendors', description: 'Create/update/delete vendors' },
  { permission_code: 'vnd_material_service.manage', module: 'Vendors', description: 'Manage a vendor\'s materials/services catalog' },
  { permission_code: 'vnd_purchase_order.create', module: 'Vendors', description: 'Create a procurement PO' },
  { permission_code: 'vnd_purchase_order.approve', module: 'Vendors', description: 'Approve a procurement PO (Manager or Finance stage)' },
  { permission_code: 'vnd_purchase_order.receive', module: 'Vendors', description: 'Record goods receipt against a procurement PO' },
  { permission_code: 'vnd_vendor_invoice.create', module: 'Vendors', description: 'Create a vendor invoice' },
  { permission_code: 'vnd_vendor_invoice.verify', module: 'Vendors', description: 'Verify a vendor invoice' },
  { permission_code: 'vnd_vendor_invoice.approve', module: 'Vendors', description: 'Approve a vendor invoice' },
  { permission_code: 'vnd_vendor_payment.create', module: 'Vendors', description: 'Create a vendor payment' },
  { permission_code: 'vnd_vendor_payment.approve', module: 'Vendors', description: 'Approve a vendor payment' },
  { permission_code: 'sec_role.manage', module: 'RBAC', description: 'Manage roles/permissions' },
];

/** role_name -> permission_code[] (doc §14 table, "representative permissions (this module)"). Super Admin/Management/Viewer are handled by the app layer's own wildcard reading of `*`/`*.read` rather than a literal '*' row here, since permission_code is a real FK target elsewhere. */
const ROLE_PERMISSIONS = {
  Admin: ['vnd_vendor.manage', 'clm_project.manage', 'sec_role.manage'],
  'Project Manager': ['clm_project.read', 'clm_project_cost.manage', 'clm_project_expense.approve'],
  'Site Engineer': ['clm_project_expense.create', 'vnd_purchase_order.receive'],
  'Procurement Manager': ['vnd_purchase_order.approve', 'vnd_vendor.manage'],
  'Procurement Officer': ['vnd_purchase_order.create', 'vnd_material_service.manage'],
  'Finance Manager': ['vnd_purchase_order.approve', 'vnd_vendor_invoice.approve', 'vnd_vendor_payment.approve'],
  Accountant: ['vnd_vendor_invoice.create', 'vnd_vendor_invoice.verify', 'vnd_vendor_payment.create', 'clm_payment.create'],
  Management: ['clm_project.read'],
};

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS };
