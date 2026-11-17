// "Ksh 3,800" / "Ksh 1,250.50": thousands separators, decimals only when needed
export const formatKsh = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Ksh —';
  return `Ksh ${n.toLocaleString('en-KE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
};
