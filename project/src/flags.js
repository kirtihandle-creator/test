'use strict';
// Seeded defect flags. All OFF by default; enabled with env var set to "1".
const NAMES = [
  'DEFECT_PATIENT_EDIT_DROPS_PHONE',
  'DEFECT_VIEWER_CAN_DELETE_TASK',
  'DEFECT_TASK_TITLE_MIN_IGNORED',
  'DEFECT_DASHBOARD_OVERDUE_OFF_BY_ONE',
  'DEFECT_PATIENT_DELETE_IGNORES_OPEN_TASKS',
  'DEFECT_LOGIN_500',
];

function readFlags(env = process.env) {
  const flags = {};
  for (const n of NAMES) flags[n] = env[n] === '1';
  return flags;
}

module.exports = { NAMES, readFlags };
