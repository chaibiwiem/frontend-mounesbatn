// "Pack soirée (400.00 DT)" - prix omis s'il est nul ou absent.
export const formatPackage = (pkg) => {
  if (!pkg) return '—';
  return Number(pkg.price) > 0 ? `${pkg.name} (${pkg.price} DT)` : pkg.name;
};
