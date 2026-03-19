import { DollarSign } from 'lucide-react';

interface CostSummaryBarProps {
  computeCosts: number;
  dataStorageCosts: number;
  licensingCosts: number;
  renderFarmCosts: number;
  dataEgressCosts: number;
}

export default function CostSummaryBar({
  computeCosts,
  dataStorageCosts,
  licensingCosts,
  renderFarmCosts,
  dataEgressCosts
}: CostSummaryBarProps) {
  const totalCost = computeCosts + dataStorageCosts + licensingCosts + renderFarmCosts + dataEgressCosts;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase">Compute Costs</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(computeCosts)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase">Data Storage</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(dataStorageCosts)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase">Licensing</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(licensingCosts)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase">Render Farm</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(renderFarmCosts)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase">Data Egress</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(dataEgressCosts)}</div>
          </div>
          <div className="space-y-1 bg-blue-50 -m-4 p-4 rounded">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div className="text-xs font-bold text-blue-900 uppercase">Total Project Cost</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalCost)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
