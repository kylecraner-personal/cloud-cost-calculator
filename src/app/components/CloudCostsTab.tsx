import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface CloudStation {
  name: string;
  costPerDay: number;
  provider: string;
}

interface CloudCostsTabProps {
  cloudStations: CloudStation[];
  onUpdate: (stations: CloudStation[]) => void;
}

export default function CloudCostsTab({ cloudStations, onUpdate }: CloudCostsTabProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CloudStation>({ name: '', costPerDay: 0, provider: 'AWS' });
  const [isAdding, setIsAdding] = useState(false);
  const [newStation, setNewStation] = useState<CloudStation>({ name: '', costPerDay: 0, provider: 'AWS' });

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...cloudStations[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editForm.name && editForm.costPerDay > 0) {
      const updated = [...cloudStations];
      updated[editingIndex] = editForm;
      onUpdate(updated);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ name: '', costPerDay: 0, provider: 'AWS' });
  };

  const deleteStation = (index: number) => {
    const updated = cloudStations.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const addStation = () => {
    if (newStation.name && newStation.costPerDay > 0) {
      onUpdate([...cloudStations, newStation]);
      setNewStation({ name: '', costPerDay: 0, provider: 'AWS' });
      setIsAdding(false);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewStation({ name: '', costPerDay: 0, provider: 'AWS' });
  };

  const getStationsByProvider = (provider: string) => {
    return cloudStations.filter(s => s.provider === provider);
  };

  const renderStationsTable = (provider: string) => {
    const stations = getStationsByProvider(provider);
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Station Name / Type</TableHead>
              <TableHead className="w-[30%]">Cost per Day</TableHead>
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
                      value={newStation.costPerDay || ''}
                      onChange={(e) => setNewStation({ ...newStation, costPerDay: parseFloat(e.target.value) || 0 })}
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
                            value={editForm.costPerDay || ''}
                            onChange={(e) => setEditForm({ ...editForm, costPerDay: parseFloat(e.target.value) || 0 })}
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
                      <TableCell>${station.costPerDay.toFixed(2)}</TableCell>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Cloud Costs</h2>
          <p className="text-gray-600 mt-2">Manage cloud workstation pricing across providers</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Cloud Station
          </Button>
        )}
      </div>

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
          <CardTitle>Cloud Workstation Pricing by Provider</CardTitle>
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
            <h4 className="font-semibold mb-2">Cloud Cost Information:</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Costs shown are per day of usage</li>
              <li>Cloud stations are only assigned when physical CG station capacity is exceeded</li>
              <li>The calculator automatically filters cloud stations based on preferred provider</li>
              <li>Pricing can be pulled from public cloud pricing pages or adjusted for negotiated rates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
