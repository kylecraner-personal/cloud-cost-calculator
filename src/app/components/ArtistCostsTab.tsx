import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/app/components/ui/radio-group";

interface License {
  name: string;
  monthly?: number;
  quarterly?: number;
  yearly?: number;
}

interface PhysicalStation {
  id: string;
  name: string;
  specs: string;
  available: boolean;
}

interface CloudStation {
  name: string;
  costPerHour: number;
  provider: string;
}

interface Artist {
  id: string;
  name: string;
  licenses: string[];
  workingDays: number;
  stationType: "physical" | "cloud";
  physicalStation?: string;
  cloudStation?: string;
}

interface ArtistCostsTabProps {
  licenses: License[];
  physicalStations: PhysicalStation[];
  cloudStations: CloudStation[];
  onComputeCostChange: (cost: number) => void;
  onLicensingCostChange: (cost: number) => void;

  state?: ArtistTabPersistedState | null;
  onStateChange?: (next: ArtistTabPersistedState) => void;
}

type ArtistTabPersistedState = {
  artists: Artist[];
  preferredCloud: string;
};

function getCheapestLicensePlan(
  license: License,
  workingDays: number,
): {
  plan: "Monthly" | "Quarterly" | "Yearly" | "N/A";
  cost: number;
} {
  const licensingMonths = Math.max(
    0,
    Math.ceil((workingDays || 0) / 21),
  );
  if (licensingMonths === 0)
    return { plan: "Monthly", cost: 0 };

  const monthlyCost =
    typeof license.monthly === "number"
      ? license.monthly * licensingMonths
      : Infinity;

  const quarterlyCost =
    typeof license.quarterly === "number"
      ? license.quarterly * Math.ceil(licensingMonths / 3)
      : Infinity;

  const yearlyCost =
    typeof license.yearly === "number"
      ? license.yearly * Math.ceil(licensingMonths / 12)
      : Infinity;

  const minCost = Math.min(
    monthlyCost,
    quarterlyCost,
    yearlyCost,
  );

  if (!isFinite(minCost))
    return { plan: "N/A", cost: Infinity };

  // Tie-breaker: prefer longer term if equal
  if (minCost === yearlyCost)
    return { plan: "Yearly", cost: yearlyCost };
  if (minCost === quarterlyCost)
    return { plan: "Quarterly", cost: quarterlyCost };
  return { plan: "Monthly", cost: monthlyCost };
}

export default function ArtistCostsTab({
  licenses,
  physicalStations,
  cloudStations,
  onComputeCostChange,
  onLicensingCostChange,
  state,
  onStateChange,
}: ArtistCostsTabProps) {
  const [artists, setArtists] = useState<Artist[]>([
    {
      id: "1",
      name: "Artist 1",
      licenses: [],
      workingDays: 0,
      stationType: "physical",
    },
  ]);
  const [preferredCloud, setPreferredCloud] =
    useState<string>("AWS");

  useEffect(() => {
    if (!state) return;

    isHydratingRef.current = true;

    if (Array.isArray(state.artists)) setArtists(state.artists);
    if (typeof state.preferredCloud === "string")
      setPreferredCloud(state.preferredCloud);

    // Allow emit again on next tick
    queueMicrotask(() => {
      isHydratingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!onStateChange) return;
    if (isHydratingRef.current) return;

    onStateChange({
      artists,
      preferredCloud,
    });
  }, [artists, preferredCloud, onStateChange]);

  // Clear invalid cloud station selections when preferred cloud changes
  useEffect(() => {
    setArtists((prev) =>
      prev.map((artist) => {
        if (
          artist.stationType !== "cloud" ||
          !artist.cloudStation
        ) {
          return artist;
        }

        const station = cloudStations.find(
          (s) => s.name === artist.cloudStation,
        );

        // If the selected station doesn't belong to the preferred provider, clear it
        if (!station || station.provider !== preferredCloud) {
          return {
            ...artist,
            cloudStation: undefined,
          };
        }

        return artist;
      }),
    );
  }, [preferredCloud, cloudStations]);

  const isHydratingRef = useRef(false);

  const addArtist = () => {
    const newArtist: Artist = {
      id: Date.now().toString(),
      name: `Artist ${artists.length + 1}`,
      licenses: [],
      workingDays: 0,
      stationType: "physical",
    };
    setArtists([...artists, newArtist]);
  };

  const removeArtist = (id: string) => {
    if (artists.length > 1) {
      setArtists(artists.filter((a) => a.id !== id));
    }
  };

  const updateArtist = (
    id: string,
    field: keyof Artist,
    value: any,
  ) => {
    setArtists(
      artists.map((a) => {
        if (a.id === id) {
          const updated = { ...a, [field]: value };
          // Clear station selection when switching type
          if (field === "stationType") {
            updated.physicalStation = undefined;
            updated.cloudStation = undefined;
          }
          return updated;
        }
        return a;
      }),
    );
  };

  const toggleLicense = (
    artistId: string,
    licenseName: string,
  ) => {
    setArtists(
      artists.map((a) => {
        if (a.id === artistId) {
          const licenses = a.licenses.includes(licenseName)
            ? a.licenses.filter((l) => l !== licenseName)
            : [...a.licenses, licenseName];
          return { ...a, licenses };
        }
        return a;
      }),
    );
  };

  const calculateLicensingCost = (
    artistLicenses: string[],
    workingDays: number,
  ) => {
    let totalCost = 0;

    artistLicenses.forEach((licenseName) => {
      const license = licenses.find(
        (l) => l.name === licenseName,
      );
      if (!license) return;

      const { cost } = getCheapestLicensePlan(
        license,
        workingDays,
      );
      if (isFinite(cost)) totalCost += cost;
    });

    return totalCost;
  };

  const calculateCloudComputeCost = (
    cloudStationName: string | undefined,
    workingDays: number,
  ) => {
    if (!cloudStationName) return 0;
    const station = cloudStations.find(
      (s) => s.name === cloudStationName,
    );
    if (!station) return 0;
    // 8 hours per working day
    const hours = workingDays * 8;
    return station.costPerHour * hours;
  };

  const getAvailablePhysicalStations = (
    currentArtistId: string,
  ) => {
    const usedStations = artists
      .filter(
        (a) => a.id !== currentArtistId && a.physicalStation,
      )
      .map((a) => a.physicalStation);
    return physicalStations.filter(
      (s) => s.available && !usedStations.includes(s.id),
    );
  };

  const getFilteredCloudStations = () => {
    return cloudStations.filter(
      (s) => s.provider === preferredCloud,
    );
  };

  // Calculate and update total costs
  const totalLicensingCost = artists.reduce((total, artist) => {
    return (
      total +
      calculateLicensingCost(
        artist.licenses,
        artist.workingDays,
      )
    );
  }, 0);

  const totalComputeCost = artists.reduce((total, artist) => {
    return (
      total +
      calculateCloudComputeCost(
        artist.cloudStation,
        artist.workingDays,
      )
    );
  }, 0);

  // Update parent component
  useEffect(() => {
    onComputeCostChange(totalComputeCost);
    onLicensingCostChange(totalLicensingCost);
  }, [
    totalComputeCost,
    totalLicensingCost,
    onComputeCostChange,
    onLicensingCostChange,
  ]);

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Artist Costs</h2>
          <p className="text-gray-600 mt-2">
            Configure artists and resources for your project
          </p>
        </div>
        <Button
          onClick={addArtist}
          className="flex items-center gap-2"
        >
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
            <Select
              value={preferredCloud}
              onValueChange={setPreferredCloud}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AWS">
                  Amazon Web Services (AWS)
                </SelectItem>
                <SelectItem value="Azure">
                  Microsoft Azure
                </SelectItem>
                <SelectItem value="GCP">
                  Google Cloud Platform (GCP)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist) => {
          const licensingCost = calculateLicensingCost(
            artist.licenses,
            artist.workingDays,
          );
          const cloudCost = calculateCloudComputeCost(
            artist.cloudStation,
            artist.workingDays,
          );
          const totalArtistCost = licensingCost + cloudCost;
          const availablePhysical =
            getAvailablePhysicalStations(artist.id);

          return (
            <Card key={artist.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={artist.name}
                    onChange={(e) =>
                      updateArtist(
                        artist.id,
                        "name",
                        e.target.value,
                      )
                    }
                    className="font-semibold text-lg border-0 focus-visible:ring-0"
                    placeholder="Artist Name"
                  />
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
                  <Label>Working Days</Label>
                  <Input
                    type="number"
                    min="0"
                    value={artist.workingDays || ""}
                    onChange={(e) =>
                      updateArtist(
                        artist.id,
                        "workingDays",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                  />
                  {artist.workingDays > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Licensing time:{" "}
                      {Math.ceil(artist.workingDays / 21)}{" "}
                      month(s) (21 days = 1 month)
                    </p>
                  )}
                </div>

                <div>
                  <Label>Software Licenses</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {licenses.map((license) => (
                      <label
                        key={license.name}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={artist.licenses.includes(
                            license.name,
                          )}
                          onChange={() =>
                            toggleLicense(
                              artist.id,
                              license.name,
                            )
                          }
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">
                          {license.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Station Type</Label>
                  <RadioGroup
                    value={artist.stationType}
                    onValueChange={(
                      value: "physical" | "cloud",
                    ) =>
                      updateArtist(
                        artist.id,
                        "stationType",
                        value,
                      )
                    }
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="physical"
                        id={`physical-${artist.id}`}
                      />
                      <Label
                        htmlFor={`physical-${artist.id}`}
                        className="cursor-pointer"
                      >
                        Physical
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="cloud"
                        id={`cloud-${artist.id}`}
                      />
                      <Label
                        htmlFor={`cloud-${artist.id}`}
                        className="cursor-pointer"
                      >
                        Cloud
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {artist.stationType === "physical" && (
                  <div>
                    <Label>Physical CG Station</Label>
                    <Select
                      value={artist.physicalStation || ""}
                      onValueChange={(value) =>
                        updateArtist(
                          artist.id,
                          "physicalStation",
                          value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availablePhysical.length === 0
                              ? "No stations available"
                              : "Select station"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePhysical.map((station) => (
                          <SelectItem
                            key={station.id}
                            value={station.id}
                          >
                            {station.name} ({station.specs})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {artist.stationType === "cloud" && (
                  <div>
                    <Label>Cloud Station</Label>
                    <Select
                      value={artist.cloudStation || ""}
                      onValueChange={(value) =>
                        updateArtist(
                          artist.id,
                          "cloudStation",
                          value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cloud station" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredCloudStations().map(
                          (station) => (
                            <SelectItem
                              key={station.name}
                              value={station.name}
                            >
                              {station.name} ($
                              {station.costPerHour.toFixed(2)}
                              /hr)
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Licensing Cost:
                    </span>
                    <span className="font-medium">
                      ${licensingCost.toFixed(2)}
                    </span>
                  </div>
                  {cloudCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Cloud Compute Cost:
                      </span>
                      <span className="font-medium">
                        ${cloudCost.toFixed(2)}
                      </span>
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
    </div>
  );
}