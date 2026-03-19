import { useState, useEffect, useRef } from "react";
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

interface CloudStation {
  name: string;
  costPerHour: number;
  provider: string;
}

interface RenderCostTabProps {
  cloudStations: CloudStation[];

  // ⬇️ ADD THESE
  preferredCloud: string;
  onPreferredCloudChange: (provider: string) => void;

  onRenderCostChange: (cost: number) => void;
  onRenderComputeChange: (compute: number) => void;
  onNodeCountChange: (count: number) => void;

  // keep if you already added persistence
  state?: any;
  onStateChange?: (s: any) => void;
}

type RenderTabPersistedState = {
  renderTimePerFrame: number;
  totalFrames: number;
  totalFullRenders: number;
  numberOfNodes: number;
  cloudNodeType: string;
  overageMultiplier: number;
};

export default function RenderCostTab({
  cloudStations,
  preferredCloud,
  onPreferredCloudChange,
  onRenderCostChange,
  onRenderComputeChange,
  onNodeCountChange,
  state,
  onStateChange,
}: RenderCostTabProps) {
  // User entered fields
  const [renderTimePerFrame, setRenderTimePerFrame] =
    useState<number>(0); // in minutes
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [totalFullRenders, setTotalFullRenders] =
    useState<number>(0);
  const [numberOfNodes, setNumberOfNodes] = useState<number>(1);
  const [cloudNodeType, setCloudNodeType] =
    useState<string>("");
  const [overageMultiplier, setOverageMultiplier] =
    useState<number>(1.2); // 20% default

  const isHydratingRef = useRef(false);

  // Hydrate local state from persisted parent state
  useEffect(() => {
    if (!state) return;

    isHydratingRef.current = true;

    if (typeof state.renderTimePerFrame === "number")
      setRenderTimePerFrame(state.renderTimePerFrame);
    if (typeof state.totalFrames === "number")
      setTotalFrames(state.totalFrames);
    if (typeof state.totalFullRenders === "number")
      setTotalFullRenders(state.totalFullRenders);
    if (typeof state.numberOfNodes === "number")
      setNumberOfNodes(state.numberOfNodes);
    if (typeof state.cloudNodeType === "string")
      setCloudNodeType(state.cloudNodeType);
    if (typeof state.overageMultiplier === "number")
      setOverageMultiplier(state.overageMultiplier);

    queueMicrotask(() => {
      isHydratingRef.current = false;
    });
  }, [state]);

  // Emit local state upward whenever it changes (but not during hydration)
  useEffect(() => {
    if (!onStateChange) return;
    if (isHydratingRef.current) return;

    onStateChange({
      renderTimePerFrame,
      totalFrames,
      totalFullRenders,
      numberOfNodes,
      cloudNodeType,
      overageMultiplier,
    });
  }, [
    renderTimePerFrame,
    totalFrames,
    totalFullRenders,
    numberOfNodes,
    cloudNodeType,
    overageMultiplier,
    onStateChange,
  ]);

  // Clear invalid node selection if it doesn't match the preferred provider
  useEffect(() => {
    if (!cloudNodeType) return;

    const station = cloudStations.find(
      (s) => s.name === cloudNodeType,
    );
    if (!station || station.provider !== preferredCloud) {
      setCloudNodeType("");
    }
  }, [preferredCloud, cloudStations, cloudNodeType]);

  // Get filtered cloud stations
  const filteredCloudStations = cloudStations.filter(
    (s) => s.provider === preferredCloud,
  );

  useEffect(() => {
    if (!cloudNodeType) return;
    const station = cloudStations.find(
      (s) => s.name === cloudNodeType,
    );
    if (!station || station.provider !== preferredCloud) {
      setCloudNodeType("");
    }
  }, [preferredCloud, cloudStations, cloudNodeType]);

  // Auto-calculated fields
  const estimatedTotalRenderTimePerRender =
    renderTimePerFrame * totalFrames; // in minutes
  const estimatedTotalRenderTimePerRenderSingleGPU =
    estimatedTotalRenderTimePerRender / 60; // in hours
  const estimatedTotalRenderTimeProjectSingleGPU =
    estimatedTotalRenderTimePerRenderSingleGPU *
    totalFullRenders; // in hours

  const selectedNode = cloudStations.find(
    (s) => s.name === cloudNodeType,
  );
  const costPerFarmHour = selectedNode
    ? selectedNode.costPerHour * numberOfNodes
    : 0;

  const hoursForTotalFarmRenderNeed =
    estimatedTotalRenderTimeProjectSingleGPU /
    (numberOfNodes || 1); // distribute across nodes
  const totalFarmHoursPerJob =
    hoursForTotalFarmRenderNeed * overageMultiplier;
  const totalCostForFarmHours =
    totalFarmHoursPerJob * costPerFarmHour;

  // Update parent
  useEffect(() => {
    onRenderCostChange(totalCostForFarmHours);
    onRenderComputeChange(totalCostForFarmHours);
    onNodeCountChange(numberOfNodes);
  }, [
    totalCostForFarmHours,
    numberOfNodes,
    onRenderCostChange,
    onRenderComputeChange,
    onNodeCountChange,
  ]);

  return (
    <div className="space-y-6 pb-32">
      <div>
        <h2 className="text-3xl font-bold">
          Render Farm Cost Calculator
        </h2>
        <p className="text-gray-600 mt-2">
          Calculate cloud rendering costs for your project
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Render Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>
                Estimated Render Time per Frame (minutes)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={renderTimePerFrame || ""}
                onChange={(e) =>
                  setRenderTimePerFrame(
                    parseFloat(e.target.value) || 0,
                  )
                }
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Average time to render a single frame
              </p>
            </div>

            <div>
              <Label>
                Total Number of Frames in Hero Deliverable
              </Label>
              <Input
                type="number"
                min="0"
                value={totalFrames || ""}
                onChange={(e) =>
                  setTotalFrames(parseInt(e.target.value) || 0)
                }
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total frames in the final render sequence
              </p>
            </div>

            <div>
              <Label>
                Estimated Total Number of Full Renders Across
                Entire Project
              </Label>
              <Input
                type="number"
                min="0"
                value={totalFullRenders || ""}
                onChange={(e) =>
                  setTotalFullRenders(
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of complete render passes expected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Farm Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Render Farm Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Number of Cloud Nodes</Label>
              <Input
                type="number"
                min="1"
                value={numberOfNodes || ""}
                onChange={(e) =>
                  setNumberOfNodes(
                    parseInt(e.target.value) || 1,
                  )
                }
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Parallel render nodes for distributed rendering
              </p>
            </div>

            <div>
              <Label>Preferred Cloud Provider</Label>
              <Select
                value={preferredCloud}
                onValueChange={onPreferredCloudChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
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
              <p className="text-xs text-gray-500 mt-1">
                Filters available node types below
              </p>
            </div>

            <div>
              <Label>Cloud Node Type</Label>
              <Select
                value={cloudNodeType}
                onValueChange={setCloudNodeType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select node type" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCloudStations.map((station) => (
                    <SelectItem
                      key={station.name}
                      value={station.name}
                    >
                      {station.name} ($
                      {station.costPerHour.toFixed(2)}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Instance type from {preferredCloud}
              </p>
            </div>

            <div>
              <Label>Overage Multiplier</Label>
              <Input
                type="number"
                min="1"
                step="0.1"
                value={overageMultiplier || ""}
                onChange={(e) =>
                  setOverageMultiplier(
                    parseFloat(e.target.value) || 1,
                  )
                }
                placeholder="1.2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Buffer for re-renders and overages (e.g., 1.2 =
                20% buffer)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Calculated Results */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle>Calculated Render Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Est. Total Render Time per Render
              </div>
              <div className="text-2xl font-bold">
                {estimatedTotalRenderTimePerRender.toLocaleString()}{" "}
                min
              </div>
              <div className="text-xs text-gray-500">
                (
                {estimatedTotalRenderTimePerRenderSingleGPU.toFixed(
                  2,
                )}{" "}
                hours)
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Est. Total Render Time (Single GPU)
              </div>
              <div className="text-2xl font-bold">
                {estimatedTotalRenderTimeProjectSingleGPU.toFixed(
                  2,
                )}{" "}
                hrs
              </div>
              <div className="text-xs text-gray-500">
                Across all {totalFullRenders} render(s)
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Cost per Farm Hour
              </div>
              <div className="text-2xl font-bold">
                ${costPerFarmHour.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {numberOfNodes} node(s) × $
                {selectedNode?.costPerHour.toFixed(2) || "0.00"}
                /hr
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Hours for Total Farm Render Need
              </div>
              <div className="text-2xl font-bold">
                {hoursForTotalFarmRenderNeed.toFixed(2)} hrs
              </div>
              <div className="text-xs text-gray-500">
                Distributed across {numberOfNodes} node(s)
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Total Farm Hours per Job
              </div>
              <div className="text-2xl font-bold">
                {totalFarmHoursPerJob.toFixed(2)} hrs
              </div>
              <div className="text-xs text-gray-500">
                Including{" "}
                {((overageMultiplier - 1) * 100).toFixed(0)}%
                overage buffer
              </div>
            </div>

            <div className="space-y-1 bg-white rounded-lg p-4 -m-2">
              <div className="text-sm text-blue-900 font-semibold">
                Total Cost for Total Farm Hours
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ${totalCostForFarmHours.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">
                Complete render farm cost
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Render Farm Costs Work</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            <li>
              <strong>Render Time per Frame:</strong> Average
              minutes needed to render one frame
            </li>
            <li>
              <strong>Total Frames:</strong> Complete frame
              count for the hero deliverable sequence
            </li>
            <li>
              <strong>Full Renders:</strong> Expected number of
              complete render passes (including revisions)
            </li>
            <li>
              <strong>Cloud Nodes:</strong> Parallel GPU
              instances that distribute the rendering workload
            </li>
            <li>
              <strong>Overage Multiplier:</strong> Safety buffer
              for test renders, failed frames, and client
              revisions
            </li>
            <li>
              <strong>Farm Hours:</strong> Total node hours
              calculated by dividing single-GPU time by node
              count
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}