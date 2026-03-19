import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Switch } from '@/app/components/ui/switch';

interface PhysicalStation {
  id: string;
  name: string;
  specs: string;
  available: boolean;
}

interface PhysicalStationsTabProps {
  stations: PhysicalStation[];
  onUpdate: (stations: PhysicalStation[]) => void;
}

export default function PhysicalStationsTab({ stations, onUpdate }: PhysicalStationsTabProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PhysicalStation>({ id: '', name: '', specs: '', available: true });
  const [isAdding, setIsAdding] = useState(false);
  const [newStation, setNewStation] = useState<PhysicalStation>({ 
    id: '', 
    name: '', 
    specs: '', 
    available: true 
  });

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...stations[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editForm.name && editForm.specs) {
      const updated = [...stations];
      updated[editingIndex] = editForm;
      onUpdate(updated);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ id: '', name: '', specs: '', available: true });
  };

  const deleteStation = (index: number) => {
    const updated = stations.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const addStation = () => {
    if (newStation.name && newStation.specs) {
      const stationWithId = {
        ...newStation,
        id: Date.now().toString()
      };
      onUpdate([...stations, stationWithId]);
      setNewStation({ id: '', name: '', specs: '', available: true });
      setIsAdding(false);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewStation({ id: '', name: '', specs: '', available: true });
  };

  const toggleAvailability = (index: number) => {
    const updated = [...stations];
    updated[index] = { ...updated[index], available: !updated[index].available };
    onUpdate(updated);
  };

  const availableCount = stations.filter(s => s.available).length;
  const totalCount = stations.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Physical CG Stations</h2>
          <p className="text-gray-600 mt-2">Manage your on-premise workstation inventory</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Station
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{availableCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">{totalCount - availableCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workstation Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Station Name</TableHead>
                  <TableHead className="w-[40%]">Specifications</TableHead>
                  <TableHead className="w-[15%]">Available</TableHead>
                  <TableHead className="w-[15%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAdding && (
                  <TableRow className="bg-blue-50">
                    <TableCell>
                      <Input
                        value={newStation.name}
                        onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                        placeholder="e.g., CG-STATION-01"
                        autoFocus
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newStation.specs}
                        onChange={(e) => setNewStation({ ...newStation, specs: e.target.value })}
                        placeholder="e.g., RTX 4090, 64GB RAM, i9-13900K"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newStation.available}
                          onCheckedChange={(checked) => setNewStation({ ...newStation, available: checked })}
                        />
                        <span className="text-sm">{newStation.available ? 'Yes' : 'No'}</span>
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
                {stations.map((station, index) => (
                  <TableRow key={station.id} className={!station.available ? 'opacity-60' : ''}>
                    {editingIndex === index ? (
                      <>
                        <TableCell>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            autoFocus
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.specs}
                            onChange={(e) => setEditForm({ ...editForm, specs: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editForm.available}
                              onCheckedChange={(checked) => setEditForm({ ...editForm, available: checked })}
                            />
                            <span className="text-sm">{editForm.available ? 'Yes' : 'No'}</span>
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
                        <TableCell className="text-sm">{station.specs}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={station.available}
                              onCheckedChange={() => toggleAvailability(index)}
                            />
                            <span className={`text-sm font-medium ${station.available ? 'text-green-600' : 'text-gray-400'}`}>
                              {station.available ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteStation(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {stations.length === 0 && !isAdding && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No physical stations configured. Click "Add Station" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Physical Station Management:</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Add new stations as they become available or are upgraded</li>
              <li>Toggle availability when stations are in use or under maintenance</li>
              <li>Each station can only be assigned to one artist at a time in the calculator</li>
              <li>When all physical stations are assigned, the calculator will automatically use cloud stations</li>
              <li>Include GPU, RAM, and CPU specs to help artists choose the right station</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
