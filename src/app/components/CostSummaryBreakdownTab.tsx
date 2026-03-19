import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Separator } from '@/app/components/ui/separator';
import { DollarSign, Users, Package, Cloud } from 'lucide-react';

interface License {
  name: string;
  monthly?: number;
  quarterly?: number;
  yearly?: number;
}

interface Artist {
  id: string;
  name: string;
  licenses: string[];
  workingDays: number;
  stationType: 'physical' | 'cloud';
  physicalStation?: string;
  cloudStation?: string;
}

interface CloudStation {
  name: string;
  costPerHour: number;
  provider: string;
}

interface CostSummaryBreakdownTabProps {
  artists: Artist[];
  licenses: License[];
  cloudStations: CloudStation[];
  renderNodeCount: number;
  renderNodeType: string;
  renderComputeCost: number;
  renderFarmCost: number;
  totalFullRenders: number;
}

export default function CostSummaryBreakdownTab({
  artists,
  licenses,
  cloudStations,
  renderNodeCount,
  renderNodeType,
  renderComputeCost,
  renderFarmCost,
  totalFullRenders
}: CostSummaryBreakdownTabProps) {
  
  // Helper function to calculate licensing cost
  const calculateLicensingCost = (licenseName: string, workingDays: number) => {
    const license = licenses.find(l => l.name === licenseName);
    if (!license) return { cost: 0, term: 'N/A', breakdown: '' };
    
    const licensingMonths = Math.ceil(workingDays / 21);
    
    const monthlyCost = license.monthly !== undefined ? license.monthly * licensingMonths : Infinity;
    const quarterlyCost = license.quarterly !== undefined ? license.quarterly * Math.ceil(licensingMonths / 3) : Infinity;
    const yearlyCost = license.yearly !== undefined ? license.yearly * Math.ceil(licensingMonths / 12) : Infinity;
    
    const cheapestCost = Math.min(monthlyCost, quarterlyCost, yearlyCost);
    
    if (cheapestCost === Infinity) return { cost: 0, term: 'N/A', breakdown: 'Not Available' };
    
    if (cheapestCost === yearlyCost) {
      const years = Math.ceil(licensingMonths / 12);
      return { 
        cost: cheapestCost, 
        term: 'Yearly', 
        breakdown: `${years} year(s) × $${license.yearly?.toFixed(2)}`
      };
    }
    if (cheapestCost === quarterlyCost) {
      const quarters = Math.ceil(licensingMonths / 3);
      return { 
        cost: cheapestCost, 
        term: 'Quarterly', 
        breakdown: `${quarters} quarter(s) × $${license.quarterly?.toFixed(2)}`
      };
    }
    return { 
      cost: cheapestCost, 
      term: 'Monthly', 
      breakdown: `${licensingMonths} month(s) × $${license.monthly?.toFixed(2)}`
    };
  };

  // Helper function to calculate cloud compute costs
  const calculateCloudComputeCost = (cloudStationName: string | undefined, workingDays: number) => {
    if (!cloudStationName) return { total: 0, hourly: 0, daily: 0, weekly: 0, provider: 'N/A' };
    const station = cloudStations.find(s => s.name === cloudStationName);
    if (!station) return { total: 0, hourly: 0, daily: 0, weekly: 0, provider: 'N/A' };
    
    const hours = workingDays * 8;
    return {
      total: station.costPerHour * hours,
      hourly: station.costPerHour,
      daily: station.costPerHour * 8,
      weekly: station.costPerHour * 40,
      provider: station.provider
    };
  };

  // Get artist breakdown data
  const artistBreakdowns = artists.map(artist => {
    const licenseCosts = artist.licenses.map(licenseName => {
      const licenseData = calculateLicensingCost(licenseName, artist.workingDays);
      return {
        name: licenseName,
        cost: licenseData.cost,
        term: licenseData.term,
        breakdown: licenseData.breakdown
      };
    });
    
    const totalLicenseCost = licenseCosts.reduce((sum, l) => sum + l.cost, 0);
    const cloudCost = artist.stationType === 'cloud' 
      ? calculateCloudComputeCost(artist.cloudStation, artist.workingDays)
      : { total: 0, hourly: 0, daily: 0, weekly: 0, provider: 'N/A' };
    
    return {
      artist,
      licenseCosts,
      totalLicenseCost,
      cloudCost,
      totalCost: totalLicenseCost + cloudCost.total
    };
  });

  // By Program breakdown
  const programBreakdown: { [key: string]: { count: number; totalCost: number; licenses: { artistName: string; cost: number; term: string }[] } } = {};
  
  artistBreakdowns.forEach(ab => {
    ab.licenseCosts.forEach(lc => {
      if (!programBreakdown[lc.name]) {
        programBreakdown[lc.name] = { count: 0, totalCost: 0, licenses: [] };
      }
      programBreakdown[lc.name].count += 1;
      programBreakdown[lc.name].totalCost += lc.cost;
      programBreakdown[lc.name].licenses.push({
        artistName: ab.artist.name,
        cost: lc.cost,
        term: lc.term
      });
    });
  });

  // By Cloud Segment breakdown
  const cloudBreakdown: { [key: string]: { artistWorkstations: number; artistCost: number; renderNodes: number; renderCost: number } } = {
    'AWS': { artistWorkstations: 0, artistCost: 0, renderNodes: 0, renderCost: 0 },
    'Azure': { artistWorkstations: 0, artistCost: 0, renderNodes: 0, renderCost: 0 },
    'GCP': { artistWorkstations: 0, artistCost: 0, renderNodes: 0, renderCost: 0 }
  };

  artistBreakdowns.forEach(ab => {
    if (ab.artist.stationType === 'cloud' && ab.cloudCost.provider !== 'N/A') {
      cloudBreakdown[ab.cloudCost.provider].artistWorkstations += 1;
      cloudBreakdown[ab.cloudCost.provider].artistCost += ab.cloudCost.total;
    }
  });

  // Add render node costs
  if (renderNodeType) {
    const renderNode = cloudStations.find(s => s.name === renderNodeType);
    if (renderNode) {
      cloudBreakdown[renderNode.provider].renderNodes = renderNodeCount;
      cloudBreakdown[renderNode.provider].renderCost = renderComputeCost;
    }
  }

  const totalArtistWorkstations = Object.values(cloudBreakdown).reduce((sum, cb) => sum + cb.artistWorkstations, 0);
  const totalArtistCloudCost = Object.values(cloudBreakdown).reduce((sum, cb) => sum + cb.artistCost, 0);
  const totalRenderCost = Object.values(cloudBreakdown).reduce((sum, cb) => sum + cb.renderCost, 0);

  return (
    <div className="space-y-6 pb-32">
      <div>
        <h2 className="text-3xl font-bold">Cost Summary + Breakdown</h2>
        <p className="text-gray-600 mt-2">Comprehensive cost analysis by artist, program, and cloud provider</p>
      </div>

      {/* By Artist Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <CardTitle>By Artist</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {artistBreakdowns.map((ab, idx) => (
            <div key={ab.artist.id} className="space-y-3">
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                <div>
                  <h3 className="font-bold text-lg">{ab.artist.name}</h3>
                  <p className="text-sm text-gray-600">
                    {ab.artist.workingDays} working days ({Math.ceil(ab.artist.workingDays / 21)} months) • 
                    {ab.artist.stationType === 'physical' ? ' Physical Station' : ` Cloud Station (${ab.cloudCost.provider})`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">${ab.totalCost.toFixed(2)}</div>
                  <div className="text-xs text-gray-600">Total Cost</div>
                </div>
              </div>

              {/* License Breakdown */}
              {ab.licenseCosts.length > 0 && (
                <div className="ml-4 space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Software Licenses:</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Program</TableHead>
                          <TableHead>Licensing Term</TableHead>
                          <TableHead>Breakdown</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ab.licenseCosts.map((lc, lcIdx) => (
                          <TableRow key={lcIdx}>
                            <TableCell className="font-medium">{lc.name}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {lc.term}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{lc.breakdown}</TableCell>
                            <TableCell className="text-right font-semibold">${lc.cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={3}>Total License Cost</TableCell>
                          <TableCell className="text-right">${ab.totalLicenseCost.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Cloud Compute Breakdown */}
              {ab.artist.stationType === 'cloud' && ab.cloudCost.total > 0 && (
                <div className="ml-4 space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Cloud Workstation ({ab.artist.cloudStation}):</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Hourly</div>
                      <div className="font-bold">${ab.cloudCost.hourly.toFixed(4)}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Daily (8hrs)</div>
                      <div className="font-bold">${ab.cloudCost.daily.toFixed(2)}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Weekly (40hrs)</div>
                      <div className="font-bold">${ab.cloudCost.weekly.toFixed(2)}</div>
                    </div>
                    <div className="bg-purple-100 p-3 rounded col-span-2">
                      <div className="text-xs text-gray-600">Project Total ({ab.artist.workingDays * 8}hrs)</div>
                      <div className="font-bold text-lg">${ab.cloudCost.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {idx < artistBreakdowns.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          {artistBreakdowns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No artists configured yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Program Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <CardTitle>By Program</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Program Name</TableHead>
                  <TableHead className="w-[15%]">Number of Licenses</TableHead>
                  <TableHead className="w-[35%]">Individual License Costs</TableHead>
                  <TableHead className="w-[20%] text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(programBreakdown).map(([programName, data]) => (
                  <TableRow key={programName}>
                    <TableCell className="font-medium">{programName}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                        {data.count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {data.licenses.map((lic, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-gray-600">{lic.artistName} ({lic.term}):</span>
                            <span className="font-medium">${lic.cost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">${data.totalCost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {Object.keys(programBreakdown).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No programs selected yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {Object.keys(programBreakdown).length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">Total Programs Used</div>
                  <div className="text-2xl font-bold">{Object.keys(programBreakdown).length}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Combined Program Licensing Cost</div>
                  <div className="text-3xl font-bold text-green-600">
                    ${Object.values(programBreakdown).reduce((sum, pb) => sum + pb.totalCost, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Cloud Segment Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-purple-600" />
            <CardTitle>By Cloud Segment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider breakdown */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cloud Provider</TableHead>
                  <TableHead className="text-center">Artist Workstations</TableHead>
                  <TableHead className="text-right">Artist Compute Cost</TableHead>
                  <TableHead className="text-center">Render Nodes</TableHead>
                  <TableHead className="text-right">Render Compute Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(cloudBreakdown).map(([provider, data]) => {
                  const total = data.artistCost + data.renderCost;
                  if (total === 0) return null;
                  
                  return (
                    <TableRow key={provider}>
                      <TableCell className="font-bold">{provider}</TableCell>
                      <TableCell className="text-center">{data.artistWorkstations}</TableCell>
                      <TableCell className="text-right">${data.artistCost.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{data.renderNodes}</TableCell>
                      <TableCell className="text-right">${data.renderCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-lg">${total.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Artist Workstations</div>
                <div className="text-3xl font-bold">{totalArtistWorkstations}</div>
                <div className="text-xs text-gray-500 mt-1">Cloud instances</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Render Nodes</div>
                <div className="text-3xl font-bold">{renderNodeCount}</div>
                <div className="text-xs text-gray-500 mt-1">Farm instances</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Artist Compute</div>
                <div className="text-2xl font-bold">${totalArtistCloudCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Workstation costs</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Render Compute</div>
                <div className="text-2xl font-bold">${totalRenderCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Farm costs</div>
              </CardContent>
            </Card>
          </div>

          {/* Render farm breakdown */}
          {totalFullRenders > 0 && renderFarmCost > 0 && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <h4 className="font-semibold mb-3">Render Farm Cost Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total Full Renders</div>
                  <div className="text-2xl font-bold">{totalFullRenders}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Cost per Full Render</div>
                  <div className="text-2xl font-bold">${(renderFarmCost / totalFullRenders).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Farm Cost</div>
                  <div className="text-2xl font-bold text-purple-600">${renderFarmCost.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Total Overall Costs */}
          <div className="p-6 bg-gradient-to-r from-gray-900 to-blue-900 text-white rounded-lg">
            <h4 className="font-semibold mb-4 text-lg">Total Cloud Compute Costs</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-300">Artist Workstations</div>
                <div className="text-2xl font-bold">${totalArtistCloudCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-300">Render Farm</div>
                <div className="text-2xl font-bold">${totalRenderCost.toFixed(2)}</div>
              </div>
              <div className="bg-white/10 p-4 rounded -m-2">
                <div className="text-sm text-gray-200">Combined Total</div>
                <div className="text-3xl font-bold text-yellow-300">${(totalArtistCloudCost + totalRenderCost).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
