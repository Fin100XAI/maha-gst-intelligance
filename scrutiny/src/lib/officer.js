// Officer designation follows the administration the officer signs in under:
// State GST → "GST Officer", Central GST (CBIC) → "Superintendent".
export const ADMINS = {
  state: { label: 'State GST', role: 'GST Officer' },
  central: { label: 'Central GST (CBIC)', role: 'Superintendent' },
};

// Sessions saved before the choice existed default to State GST.
export const withDesignation = (user) => {
  if (!user) return user;
  const admin = ADMINS[user.admin] ? user.admin : 'state';
  return { ...user, admin, role: ADMINS[admin].role };
};
