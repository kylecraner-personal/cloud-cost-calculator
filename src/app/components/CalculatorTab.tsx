import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

interface License {
  name: string;
  cost: number;
  term: number;
}

interface PhysicalStation {
  id: string;
  name: string;
  specs: string;
  available: boolean;
}

interface CloudStation {
  name: string;
  costPerDay: number;
  provider: string;
}

interface Artist {
  id: string;
  name: string;
  licenses: string[];
  workingDays: number;
  physicalStation?: string;
  cloudStation?: string;
}

interface CalculatorTabProps {
  licenses: License[];
  physicalStations: PhysicalStation[];
  cloudStations: CloudStation[];
}

export default function CalculatorTab({ licenses, physicalStations, cloudStations }: CalculatorTabProps) {
  const [artists, setArtists] = useState<Artist[]>([
    { id: '1', name: 'Artist 1', licenses: [], workingDays: 0 }
  ]);
  const [preferredCloud, setPreferredCloud] = useState<string>('AWS');

  const addArtist = () => {
    const newArtist: Artist = {
      id: Date.now().toString(),
      name: `Artist ${artists.length + 1}`,
      licenses: [],
      workingDays: 0
    };
    setArtists([...artists, newArtist]);
  };

  const removeArtist = (id: string) => {
    if (artists.length > 1) {
      setArtists(artists.filter(a => a.id !== id));
    }
  };

  const updateArtist = (id: string, field: keyof Artist, value: any) => {
    setArtists(artists.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const toggleLicense = (artistId: string, licenseName: string) => {
    setArtists(artists.map(a => {
      if (a.id === artistId) {
        const licenses = a.licenses.includes(licenseName)
          ? a.licenses.filter(l => l !== licenseName)
          : [...a.licenses, licenseName];
        return { ...a, licenses };
      }
      return a;
    }));
  };

  const calculateLicensingCost = (artistLicenses: string[], workingDays: number) => {
    let totalCost = 0;
    artistLicenses.forEach(licenseName => {
      const license = licenses.find(l => l.name === licenseName);
      if (license) {
        const licensingMonths = Math.ceil(workingDays / 30);
        const terms = Math.ceil(licensingMonths / license.term);
        totalCost += license.cost * terms;
      }
    });
    return totalCost;
  };

  const calculateCloudStationCost = (cloudStationName: string | undefined, workingDays: number) => {
    if (!cloudStationName) return 0;
    const station = cloudStations.find(s => s.name === cloudStationName);
    return station ? station.costPerDay * workingDays : 0;
  };

  const getAvailablePhysicalStations = (currentArtistId: string) => {
    const usedStations = artists
      .filter(a => a.id !== currentArtistId && a.physicalStation)
      .map(a => a.physicalStation);
    return physicalStations.filter(s => s.available && !usedStations.includes(s.id));
  };

  const getFilteredCloudStations = () => {
    return cloudStations.filter(s => s.provider === preferredCloud);
  };

  const calculateTotalCost = () => {
    return artists.reduce((total, artist) => {
      const licensingCost = calculateLicensingCost(artist.licenses, artist.workingDays);
      const cloudCost = calculateCloudStationCost(artist.cloudStation, artist.workingDays);
      return total + licensingCost + cloudCost;
    }, 0);
  };

  // Auto-assign stations based on physical capacity
  useEffect(() => {
    const updatedArtists = [...artists];
    const availableStations = [...physicalStations.filter(s => s.available)];
    
    updatedArtists.forEach((artist, index) => {
      if (index < availableStations.length) {
        if (!artist.physicalStation) {
          artist.physicalStation = availableStations[index].id;
          artist.cloudStation = undefined;
        }
      } else {
        artist.physicalStation = undefined;
      }
    });
    
    if (JSON.stringify(updatedArtists) !== JSON.stringify(artists)) {
      setArtists(updatedArtists);
    }
  }, [artists.length, physicalStations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Project Cost Calculator</h2>
          <p className="text-gray-600 mt-2">Configure artists and resources for your project</p>
        </div>
        <Button onClick={addArtist} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Artist
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preferred Cloud Provider</Label>
            <Select value={preferredCloud} onValueChange={setPreferredCloud}>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist, index) => {
          const licensingCost = calculateLicensingCost(artist.licenses, artist.workingDays);
          const cloudCost = calculateCloudStationCost(artist.cloudStation, artist.workingDays);
          const totalArtistCost = licensingCost + cloudCost;
          const availablePhysical = getAvailablePhysicalStations(artist.id);
          const needsCloudStation = availablePhysical.length === 0 && !artist.physicalStation;

          return (
            <Card key={artist.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{artist.name}</CardTitle>
                  {artists.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArtist(artist.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Artist Name</Label>
                  <Input
                    value={artist.name}
                    onChange={(e) => updateArtist(artist.id, 'name', e.target.value)}
                    placeholder="Enter artist name"
                  />
                </div>

                <div>
                  <Label>Working Days</Label>
                  <Input
                    type="number"
                    min="0"
                    value={artist.workingDays || ''}
                    onChange={(e) => updateArtist(artist.id, 'workingDays', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  {artist.workingDays > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Licensing time: {Math.ceil(artist.workingDays / 30)} month(s)
                    </p>
                  )}
                </div>

                <div>
                  <Label>Software Licenses</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {licenses.map(license => (
                      <label key={license.name} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={artist.licenses.includes(license.name)}
                          onChange={() => toggleLicense(artist.id, license.name)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{license.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Physical CG Station</Label>
                  <Select
                    value={artist.physicalStation || ''}
                    onValueChange={(value) => {
                      updateArtist(artist.id, 'physicalStation', value);
                      updateArtist(artist.id, 'cloudStation', undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={needsCloudStation ? "No physical stations available" : "Select station"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePhysical.map(station => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name} ({station.specs})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {needsCloudStation && (
                  <div>
                    <Label>Cloud Station (Required)</Label>
                    <Select
                      value={artist.cloudStation || ''}
                      onValueChange={(value) => updateArtist(artist.id, 'cloudStation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cloud station" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredCloudStations().map(station => (
                          <SelectItem key={station.name} value={station.name}>
                            {station.name} (${station.costPerDay}/day)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Licensing Cost:</span>
                    <span className="font-medium">${licensingCost.toFixed(2)}</span>
                  </div>
                  {cloudCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cloud Station Cost:</span>
                      <span className="font-medium">${cloudCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total Artist Cost:</span>
                    <span>${totalArtistCost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">Total Project Cost</h3>
              <p className="text-gray-600">Across all {artists.length} artist(s)</p>
            </div>
            <div className="text-4xl font-bold text-blue-600">
              ${calculateTotalCost().toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
