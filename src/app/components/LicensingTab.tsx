import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Checkbox } from "@/app/components/ui/checkbox";

interface License {
  name: string;
  monthly?: number;
  quarterly?: number;
  yearly?: number;
}

interface LicensingTabProps {
  licenses: License[];
  onUpdate: (licenses: License[]) => void;
}

function getCheapestLicensePlan(
  license: License,
  workingDays: number,
): {
  plan: "Monthly" | "Quarterly" | "Yearly" | "N/A";
  cost: number; // Infinity if N/A
  licensingMonths: number;
} {
  const licensingMonths = Math.max(
    0,
    Math.ceil((workingDays || 0) / 21),
  );

  // If no time needed, cost is 0 (and we can return Monthly by convention)
  if (licensingMonths === 0) {
    return { plan: "Monthly", cost: 0, licensingMonths: 0 };
  }

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
    return { plan: "N/A", cost: Infinity, licensingMonths };

  // Tie-breaker: prefer longer terms when costs are equal (less admin)
  if (minCost === yearlyCost)
    return {
      plan: "Yearly",
      cost: yearlyCost,
      licensingMonths,
    };
  if (minCost === quarterlyCost)
    return {
      plan: "Quarterly",
      cost: quarterlyCost,
      licensingMonths,
    };
  return {
    plan: "Monthly",
    cost: monthlyCost,
    licensingMonths,
  };
}

export default function LicensingTab({
  licenses,
  onUpdate,
}: LicensingTabProps) {
  const [editingIndex, setEditingIndex] = useState<
    number | null
  >(null);
  const [editForm, setEditForm] = useState<License>({
    name: "",
    monthly: undefined,
    quarterly: undefined,
    yearly: undefined,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newLicense, setNewLicense] = useState<License>({
    name: "",
    monthly: undefined,
    quarterly: undefined,
    yearly: undefined,
  });

  // Availability states for add form
  const [hasMonthly, setHasMonthly] = useState(true);
  const [hasQuarterly, setHasQuarterly] = useState(true);
  const [hasYearly, setHasYearly] = useState(true);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...licenses[index] });
  };

  const saveEdit = () => {
    if (
      editingIndex !== null &&
      editForm.name &&
      (editForm.monthly !== undefined ||
        editForm.quarterly !== undefined ||
        editForm.yearly !== undefined)
    ) {
      const updated = [...licenses];
      updated[editingIndex] = editForm;
      onUpdate(updated);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({
      name: "",
      monthly: undefined,
      quarterly: undefined,
      yearly: undefined,
    });
  };

  const deleteLicense = (index: number) => {
    const updated = licenses.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const addLicense = () => {
    if (
      newLicense.name &&
      (newLicense.monthly !== undefined ||
        newLicense.quarterly !== undefined ||
        newLicense.yearly !== undefined)
    ) {
      onUpdate([...licenses, newLicense]);
      setNewLicense({
        name: "",
        monthly: undefined,
        quarterly: undefined,
        yearly: undefined,
      });
      setIsAdding(false);
      setHasMonthly(true);
      setHasQuarterly(true);
      setHasYearly(true);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewLicense({
      name: "",
      monthly: undefined,
      quarterly: undefined,
      yearly: undefined,
    });
    setHasMonthly(true);
    setHasQuarterly(true);
    setHasYearly(true);
  };

  const getCheapestOption = (
    license: License,
    workingDays: number,
  ) => {
    return getCheapestLicensePlan(license, workingDays).plan;
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Program Licensing
          </h2>
          <p className="text-gray-600 mt-2">
            Manage software licenses with monthly, quarterly,
            and yearly pricing
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add License
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Software Licenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">
                    License Name
                  </TableHead>
                  <TableHead className="w-[15%]">
                    Monthly
                  </TableHead>
                  <TableHead className="w-[15%]">
                    Quarterly
                  </TableHead>
                  <TableHead className="w-[15%]">
                    Yearly
                  </TableHead>
                  <TableHead className="w-[15%]">
                    Best for 60 Days
                  </TableHead>
                  <TableHead className="w-[10%] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAdding && (
                  <TableRow className="bg-blue-50">
                    <TableCell>
                      <Input
                        value={newLicense.name}
                        onChange={(e) =>
                          setNewLicense({
                            ...newLicense,
                            name: e.target.value,
                          })
                        }
                        placeholder="License name"
                        autoFocus
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={hasMonthly}
                            onCheckedChange={(checked) => {
                              setHasMonthly(checked as boolean);
                              if (!checked) {
                                setNewLicense({
                                  ...newLicense,
                                  monthly: undefined,
                                });
                              }
                            }}
                          />
                          <span className="text-xs">
                            Available
                          </span>
                        </div>
                        {hasMonthly && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={newLicense.monthly || ""}
                              onChange={(e) =>
                                setNewLicense({
                                  ...newLicense,
                                  monthly:
                                    parseFloat(
                                      e.target.value,
                                    ) || undefined,
                                })
                              }
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={hasQuarterly}
                            onCheckedChange={(checked) => {
                              setHasQuarterly(
                                checked as boolean,
                              );
                              if (!checked) {
                                setNewLicense({
                                  ...newLicense,
                                  quarterly: undefined,
                                });
                              }
                            }}
                          />
                          <span className="text-xs">
                            Available
                          </span>
                        </div>
                        {hasQuarterly && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={newLicense.quarterly || ""}
                              onChange={(e) =>
                                setNewLicense({
                                  ...newLicense,
                                  quarterly:
                                    parseFloat(
                                      e.target.value,
                                    ) || undefined,
                                })
                              }
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={hasYearly}
                            onCheckedChange={(checked) => {
                              setHasYearly(checked as boolean);
                              if (!checked) {
                                setNewLicense({
                                  ...newLicense,
                                  yearly: undefined,
                                });
                              }
                            }}
                          />
                          <span className="text-xs">
                            Available
                          </span>
                        </div>
                        {hasYearly && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={newLicense.yearly || ""}
                              onChange={(e) =>
                                setNewLicense({
                                  ...newLicense,
                                  yearly:
                                    parseFloat(
                                      e.target.value,
                                    ) || undefined,
                                })
                              }
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={addLicense}
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
                {licenses.map((license, index) => {
                  const bestOption = getCheapestOption(
                    license,
                    60,
                  );
                  return (
                    <TableRow key={index}>
                      {editingIndex === index ? (
                        <>
                          <TableCell>
                            <Input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              autoFocus
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    editForm.monthly !==
                                    undefined
                                  }
                                  onCheckedChange={(
                                    checked,
                                  ) => {
                                    if (!checked) {
                                      setEditForm({
                                        ...editForm,
                                        monthly: undefined,
                                      });
                                    } else {
                                      setEditForm({
                                        ...editForm,
                                        monthly: 0,
                                      });
                                    }
                                  }}
                                />
                                <span className="text-xs">
                                  Available
                                </span>
                              </div>
                              {editForm.monthly !==
                                undefined && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      editForm.monthly || ""
                                    }
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        monthly:
                                          parseFloat(
                                            e.target.value,
                                          ) || undefined,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    editForm.quarterly !==
                                    undefined
                                  }
                                  onCheckedChange={(
                                    checked,
                                  ) => {
                                    if (!checked) {
                                      setEditForm({
                                        ...editForm,
                                        quarterly: undefined,
                                      });
                                    } else {
                                      setEditForm({
                                        ...editForm,
                                        quarterly: 0,
                                      });
                                    }
                                  }}
                                />
                                <span className="text-xs">
                                  Available
                                </span>
                              </div>
                              {editForm.quarterly !==
                                undefined && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      editForm.quarterly || ""
                                    }
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        quarterly:
                                          parseFloat(
                                            e.target.value,
                                          ) || undefined,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    editForm.yearly !==
                                    undefined
                                  }
                                  onCheckedChange={(
                                    checked,
                                  ) => {
                                    if (!checked) {
                                      setEditForm({
                                        ...editForm,
                                        yearly: undefined,
                                      });
                                    } else {
                                      setEditForm({
                                        ...editForm,
                                        yearly: 0,
                                      });
                                    }
                                  }}
                                />
                                <span className="text-xs">
                                  Available
                                </span>
                              </div>
                              {editForm.yearly !==
                                undefined && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      editForm.yearly || ""
                                    }
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        yearly:
                                          parseFloat(
                                            e.target.value,
                                          ) || undefined,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>-</TableCell>
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
                          <TableCell className="font-medium">
                            {license.name}
                          </TableCell>
                          <TableCell>
                            {license.monthly !== undefined ? (
                              `$${license.monthly.toFixed(2)}`
                            ) : (
                              <span className="text-gray-400 italic">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {license.quarterly !== undefined ? (
                              `$${license.quarterly.toFixed(2)}`
                            ) : (
                              <span className="text-gray-400 italic">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {license.yearly !== undefined ? (
                              `$${license.yearly.toFixed(2)}`
                            ) : (
                              <span className="text-gray-400 italic">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {bestOption !== "N/A" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {bestOption}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">
                                N/A
                              </span>
                            )}
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
                                onClick={() =>
                                  deleteLicense(index)
                                }
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
                {licenses.length === 0 && !isAdding && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      No licenses configured. Click "Add
                      License" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">
              How Licensing Works:
            </h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Monthly:</strong> Cost for one month of
                licensing (21 working days)
              </li>
              <li>
                <strong>Quarterly:</strong> Cost for three
                months (optional - some licenses don't offer
                this)
              </li>
              <li>
                <strong>Yearly:</strong> Cost for twelve months
                of licensing
              </li>
              <li>
                Each licensing tier can be toggled as available
                or unavailable using the checkbox
              </li>
              <li>
                The calculator automatically selects the
                cheapest option based on project working days
              </li>
              <li>
                Example: 60 working days = 3 months. If
                quarterly costs less than 3× monthly, quarterly
                is chosen
              </li>
              <li>
                Some licenses like Blender are free - set all
                pricing tiers to $0
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}