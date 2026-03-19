import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface CloudStation {
  name: string;
  costPerHour: number;
  provider: string;
}

interface CloudComputeCostTabProps {
  cloudStations: CloudStation[];
  onUpdate: (stations: CloudStation[]) => void;
  activeArtistStations: number;
  renderNodes: number;
  artistComputeCost: number;
  renderComputeCost: number;
}

export default function CloudComputeCostTab({ 
  cloudStations, 
  onUpdate,
  activeArtistStations,
  renderNodes,
  artistComputeCost,
  renderComputeCost
}: CloudComputeCostTabProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CloudStation>({ name: '', costPerHour: 0, provider: 'AWS' });
  const [isAdding, setIsAdding] = useState(false);
  const [newStation, setNewStation] = useState<CloudStation>({ name: '', costPerHour: 0, provider: 'AWS' });
  const [comparisonProvider, setComparisonProvider] = useState<string>('AWS');

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...cloudStations[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editForm.name && editForm.costPerHour > 0) {
      const updated = [...cloudStations];
      updated[editingIndex] = editForm;
      onUpdate(updated);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ name: '', costPerHour: 0, provider: 'AWS' });
  };

  const deleteStation = (index: number) => {
    const updated = cloudStations.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const addStation = () => {
    if (newStation.name && newStation.costPerHour > 0) {
      onUpdate([...cloudStations, newStation]);
      setNewStation({ name: '', costPerHour: 0, provider: 'AWS' });
      setIsAdding(false);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewStation({ name: '', costPerHour: 0, provider: 'AWS' });
  };

  const getStationsByProvider = (provider: string) => {
    return cloudStations.filter(s => s.provider === provider);
  };

  const getEquivalentStations = (stationName: string, currentProvider: string) => {
    // Simple matching logic - can be enhanced
    const providers = ['AWS', 'Azure', 'GCP'].filter(p => p !== currentProvider);
    return providers.map(provider => {
      const stations = getStationsByProvider(provider);
      // Return first station as example - in real app, would match by specs
      return stations.length > 0 ? stations[0] : null;
    }).filter(s => s !== null);
  };

  const renderStationsTable = (provider: string) => {
    const stations = getStationsByProvider(provider);
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Instance Type</TableHead>
              <TableHead className="w-[30%]">Cost per Hour</TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && newStation.provider === provider && (
              <TableRow className="bg-blue-50">
                <TableCell>
                  <Input
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                    placeholder="e.g., g4dn.xlarge or Standard_NC6s_v3"
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newStation.costPerHour || ''}
                      onChange={(e) => setNewStation({ ...newStation, costPerHour: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={addStation}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelAdd}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {stations.map((station, index) => {
              const globalIndex = cloudStations.indexOf(station);
              return (
                <TableRow key={globalIndex}>
                  {editingIndex === globalIndex ? (
                    <>
                      <TableCell>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          autoFocus
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.costPerHour || ''}
                            onChange={(e) => setEditForm({ ...editForm, costPerHour: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={saveEdit}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell>${station.costPerHour.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(globalIndex)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteStation(globalIndex)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
            {stations.length === 0 && (!isAdding || newStation.provider !== provider) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  No {provider} cloud stations configured. Click "Add Cloud Station" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Cloud Compute Costs</h2>
          <p className="text-gray-600 mt-2">Manage cloud workstation pricing across providers (hourly rates)</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Cloud Station
          </Button>
        )}
      </div>

      {/* Usage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Artist Workstations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Cloud Stations:</span>
                <span className="text-2xl font-bold">{activeArtistStations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Artist Compute:</span>
                <span className="text-xl font-bold text-blue-600">${artistComputeCost.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Render Farm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Render Nodes:</span>
                <span className="text-2xl font-bold">{renderNodes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Render Compute:</span>
                <span className="text-xl font-bold text-purple-600">${renderComputeCost.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Compute Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium">Artist Workstations</div>
                <div className="text-sm text-gray-600">{activeArtistStations} cloud station(s)</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">${artistComputeCost.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <div className="font-medium">Render Farm Nodes</div>
                <div className="text-sm text-gray-600">{renderNodes} node(s)</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">${renderComputeCost.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
              <div>
                <div className="font-bold text-lg">Total Compute Cost</div>
                <div className="text-sm text-gray-600">Artists + Render Farm</div>
              </div>
              <div className="text-3xl font-bold">${(artistComputeCost + renderComputeCost).toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdding && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Add New Cloud Station</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cloud Provider</label>
                <Select
                  value={newStation.provider}
                  onValueChange={(value) => setNewStation({ ...newStation, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AWS">Amazon Web Services (AWS)</SelectItem>
                    <SelectItem value="Azure">Microsoft Azure</SelectItem>
                    <SelectItem value="GCP">Google Cloud Platform (GCP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-600">
                Select the provider above, then fill in the details in the table for that provider's tab.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cloud Instance Pricing by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="AWS" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="AWS">AWS</TabsTrigger>
              <TabsTrigger value="Azure">Azure</TabsTrigger>
              <TabsTrigger value="GCP">GCP</TabsTrigger>
            </TabsList>
            <TabsContent value="AWS" className="mt-4">
              {renderStationsTable('AWS')}
            </TabsContent>
            <TabsContent value="Azure" className="mt-4">
              {renderStationsTable('Azure')}
            </TabsContent>
            <TabsContent value="GCP" className="mt-4">
              {renderStationsTable('GCP')}
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Cloud Compute Information:</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>All costs shown are per hour of usage</li>
              <li>Artist workstations are calculated based on 8 hours per working day</li>
              <li>Render farm costs are calculated based on total farm hours needed</li>
              <li>Pricing should reflect public rates or your negotiated enterprise discounts</li>
              <li>Consider instance specs (GPU, RAM, CPU) when comparing across providers</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Provider Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Provider Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Compare Similar Instances Across Providers</Label>
              <Select value={comparisonProvider} onValueChange={setComparisonProvider}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AWS">AWS Instances</SelectItem>
                  <SelectItem value="Azure">Azure Instances</SelectItem>
                  <SelectItem value="GCP">GCP Instances</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Cost/Hour</TableHead>
                    <TableHead>Cost/Day (8hrs)</TableHead>
                    <TableHead>Cost/Month (160hrs)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getStationsByProvider(comparisonProvider).map((station, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell>{station.provider}</TableCell>
                      <TableCell>${station.costPerHour.toFixed(4)}</TableCell>
                      <TableCell>${(station.costPerHour * 8).toFixed(2)}</TableCell>
                      <TableCell>${(station.costPerHour * 160).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {getStationsByProvider(comparisonProvider).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No instances configured for {comparisonProvider}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
