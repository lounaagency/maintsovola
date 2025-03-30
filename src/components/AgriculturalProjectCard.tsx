
// This is a partial update to fix line 99 where a number needs to be converted to string
export const fundingPercentage = totalInvestment > 0 && project.cout_total > 0
  ? Math.min(Math.round((totalInvestment / project.cout_total) * 100), 100)
  : 0;

// Ensure the percentage is rendered as a string
<span className="font-medium text-sm">{String(fundingPercentage)}%</span>
