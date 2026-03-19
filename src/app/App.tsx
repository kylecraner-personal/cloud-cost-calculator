import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator,
  CreditCard,
  Cloud,
  Monitor,
  Cpu,
  FileText,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import ArtistCostsTab from "@/app/components/ArtistCostsTab";
import LicensingTab from "@/app/components/LicensingTab";
import CloudComputeCostTab from "@/app/components/CloudComputeCostTab";
import PhysicalStationsTab from "@/app/components/PhysicalStationsTab";
import RenderCostTab from "@/app/components/RenderCostTab";
import CostSummaryBar from "@/app/components/CostSummaryBar";
import CostSummaryBreakdownTab from "@/app/components/CostSummaryBreakdownTab";

// --- Google Sheets API (via Vercel serverless function) ---
const API_BASE = "/api/projects";

// Insert a new project and return its id
async function apiInsertProject(state: any): Promise<string> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const id = json?.id;
  if (!id) throw new Error("Insert succeeded but no id returned");
  return id;
}

// Load project state by id
async function apiSelectState(projectId: string): Promise<any> {
  const res = await fetch(
    `${API_BASE}?id=${encodeURIComponent(projectId)}`,
    { method: "GET" },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Select failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json?.state ?? {};
}

// Update project state by id
async function apiUpdateState(
  projectId: string,
  state: any,
): Promise<void> {
  const res = await fetch(API_BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: projectId, state }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed: ${res.status} ${text}`);
  }
}

// Local storage key for this browser/session
const PROJECT_ID_STORAGE_KEY = "cost_calc_project_id";

// What we persist (one JSON blob)
type CalculatorSnapshot = {
  licenses: any[];
  cloudStations: any[];
  physicalStations: any[];
  preferredCloud: string;
  artistTabState?: any;
  projectName: string;
  renderTabState?: any;

  // Optional: persist these so totals restore after refresh
  artistComputeCost: number;
  artistLicensingCost: number;
  renderComputeCost: number;
  renderFarmCost: number;
  dataStorageCost: number;
  dataEgressCost: number;
  activeArtistStations: number;
  renderNodeCount: number;

  // Optional: restore user’s tab
  activeTab: string;
};

// Initial sample data with comprehensive licensing from the Google Sheet
const initialLicenses = [
  { name: "Maya", monthly: 235, quarterly: 660, yearly: 1875 },
  {
    name: "Houdini",
    monthly: 269,
    quarterly: undefined,
    yearly: 2995,
  },
  {
    name: "3ds Max",
    monthly: 235,
    quarterly: 660,
    yearly: 1875,
  },
  {
    name: "Substance 3D Painter",
    monthly: 19.99,
    quarterly: 54.99,
    yearly: 179.99,
  },
  {
    name: "Substance 3D Designer",
    monthly: 19.99,
    quarterly: 54.99,
    yearly: 179.99,
  },
  {
    name: "Substance 3D Sampler",
    monthly: 19.99,
    quarterly: 54.99,
    yearly: 179.99,
  },
  {
    name: "Substance 3D Stager",
    monthly: 19.99,
    quarterly: 54.99,
    yearly: 179.99,
  },
  {
    name: "ZBrush",
    monthly: 39.95,
    quarterly: undefined,
    yearly: 359.88,
  },
  {
    name: "Adobe Creative Cloud (All Apps)",
    monthly: 54.99,
    quarterly: 149.97,
    yearly: 599.88,
  },
  { name: "V-Ray", monthly: 52, quarterly: 140, yearly: 470 },
  {
    name: "Arnold",
    monthly: 45,
    quarterly: undefined,
    yearly: 380,
  },
  {
    name: "Nuke",
    monthly: 538,
    quarterly: undefined,
    yearly: 5382,
  },
  {
    name: "Mari",
    monthly: 299,
    quarterly: undefined,
    yearly: 2990,
  },
  {
    name: "Redshift",
    monthly: 65,
    quarterly: 175,
    yearly: 650,
  },
  {
    name: "Octane Render",
    monthly: 19.99,
    quarterly: 49.99,
    yearly: 199.88,
  },
  {
    name: "Cinema 4D",
    monthly: 94.99,
    quarterly: 269.99,
    yearly: 999.99,
  },
  { name: "Blender", monthly: 0, quarterly: 0, yearly: 0 },
  {
    name: "Unreal Engine",
    monthly: 0,
    quarterly: 0,
    yearly: 0,
  },
  {
    name: "Unity Pro",
    monthly: 185,
    quarterly: 555,
    yearly: 2220,
  },
  {
    name: "Marvelous Designer",
    monthly: 49,
    quarterly: 135,
    yearly: 470,
  },
  { name: "Rizom UV", monthly: 0, quarterly: 0, yearly: 99 },
  {
    name: "Marmoset Toolbag",
    monthly: 0,
    quarterly: 0,
    yearly: 189,
  },
  {
    name: "Foundry Modo",
    monthly: 60,
    quarterly: 165,
    yearly: 599,
  },
];

const initialCloudStations = [
  // AWS
  { name: "g4dn.xlarge", costPerHour: 0.526, provider: "AWS" },
  { name: "g4dn.2xlarge", costPerHour: 0.752, provider: "AWS" },
  { name: "g4dn.4xlarge", costPerHour: 1.204, provider: "AWS" },
  { name: "g4dn.8xlarge", costPerHour: 2.176, provider: "AWS" },
  { name: "g5.xlarge", costPerHour: 1.006, provider: "AWS" },
  { name: "g5.2xlarge", costPerHour: 1.212, provider: "AWS" },
  { name: "g5.4xlarge", costPerHour: 1.624, provider: "AWS" },
  // Azure
  {
    name: "Standard_NC6s_v3",
    costPerHour: 1.14,
    provider: "Azure",
  },
  {
    name: "Standard_NC12s_v3",
    costPerHour: 2.28,
    provider: "Azure",
  },
  {
    name: "Standard_NC24s_v3",
    costPerHour: 4.56,
    provider: "Azure",
  },
  {
    name: "Standard_NV6",
    costPerHour: 1.14,
    provider: "Azure",
  },
  {
    name: "Standard_NV12",
    costPerHour: 2.28,
    provider: "Azure",
  },
  // GCP
  {
    name: "n1-standard-4 + NVIDIA T4",
    costPerHour: 0.74,
    provider: "GCP",
  },
  {
    name: "n1-standard-8 + NVIDIA T4",
    costPerHour: 1.034,
    provider: "GCP",
  },
  {
    name: "n1-standard-16 + NVIDIA T4",
    costPerHour: 1.606,
    provider: "GCP",
  },
  {
    name: "n1-standard-8 + NVIDIA V100",
    costPerHour: 2.431,
    provider: "GCP",
  },
  {
    name: "a2-highgpu-1g",
    costPerHour: 3.673,
    provider: "GCP",
  },
];

const initialPhysicalStations = [
  {
    id: "1",
    name: "CG-STATION-01",
    specs: "RTX 4090, 64GB RAM, i9-13900K",
    available: true,
  },
  {
    id: "2",
    name: "CG-STATION-02",
    specs: "RTX 4080, 64GB RAM, i9-13900K",
    available: true,
  },
  {
    id: "3",
    name: "CG-STATION-03",
    specs: "RTX 4080, 32GB RAM, i7-13700K",
    available: true,
  },
  {
    id: "4",
    name: "CG-STATION-04",
    specs: "RTX 3090, 64GB RAM, i9-12900K",
    available: true,
  },
  {
    id: "5",
    name: "CG-STATION-05",
    specs: "RTX 3080, 32GB RAM, i7-12700K",
    available: true,
  },
  {
    id: "6",
    name: "CG-STATION-06",
    specs: "RTX 3080, 32GB RAM, i7-12700K",
    available: false,
  },
];

export default function App() {
  const [licenses, setLicenses] = useState(initialLicenses);
  const [cloudStations, setCloudStations] = useState(
    initialCloudStations,
  );
  const [physicalStations, setPhysicalStations] = useState(
    initialPhysicalStations,
  );
  const [activeTab, setActiveTab] = useState("artists");
  const [preferredCloud, setPreferredCloud] = useState("AWS");
  const [artistTabState, setArtistTabState] =
    useState<any>(null);

  //render tab state storage
  const [renderTabState, setRenderTabState] =
    useState<any>(null);

  // Project naming
  const [projectName, setProjectName] = useState<string>(
    "Untitled Project",
  );

  // Save status UI
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    null,
  );

  // --- Persistence state ---
  const [projectId, setProjectId] = useState<string>(() => {
    return localStorage.getItem(PROJECT_ID_STORAGE_KEY) || "";
  });
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const saveTimerRef = useRef<number | null>(null);
  const hasUserEditedRef = useRef<boolean>(false);

  // Cost tracking states
  const [artistComputeCost, setArtistComputeCost] = useState(0);
  const [artistLicensingCost, setArtistLicensingCost] =
    useState(0);
  const [renderComputeCost, setRenderComputeCost] = useState(0);
  const [renderFarmCost, setRenderFarmCost] = useState(0);
  const [dataStorageCost, setDataStorageCost] = useState(0);
  const [dataEgressCost, setDataEgressCost] = useState(0);
  const [activeArtistStations, setActiveArtistStations] =
    useState(0);
  const [renderNodeCount, setRenderNodeCount] = useState(0);

  // Build the persisted snapshot from your existing React state
  const snapshot: CalculatorSnapshot = useMemo(
    () => ({
      projectName,
      licenses,
      cloudStations,
      physicalStations,
      preferredCloud,

      artistTabState,
      renderTabState,

      artistComputeCost,
      artistLicensingCost,
      renderComputeCost,
      renderFarmCost,
      dataStorageCost,
      dataEgressCost,
      activeArtistStations,
      renderNodeCount,

      activeTab,
    }),
    [
      projectName,
      licenses,
      cloudStations,
      physicalStations,
      preferredCloud,
      artistTabState,
      renderTabState,
      artistComputeCost,
      artistLicensingCost,
      renderComputeCost,
      renderFarmCost,
      dataStorageCost,
      dataEgressCost,
      activeArtistStations,
      renderNodeCount,
      activeTab,
    ],
  );

  useEffect(() => {
    if (isHydrating) return;
    hasUserEditedRef.current = true;
  }, [snapshot]);

  // Ensure we have a project row in Google Sheets
  useEffect(() => {
    let cancelled = false;

    async function ensureProject() {
      // If we already have a projectId, nothing to do
      if (projectId) return;

      try {
        const id = await apiInsertProject(snapshot);
        if (!cancelled) {
          localStorage.setItem(PROJECT_ID_STORAGE_KEY, id);
          setProjectId(id);
        }
      } catch (error) {
        console.error("Create project failed:", error);
        // Keep app usable even if save fails
        setIsHydrating(false);
      }
    }

    ensureProject();

    return () => {
      cancelled = true;
    };
    // snapshot intentionally NOT in deps here; we only need it for initial insert
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Load saved state once projectId is known
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!projectId) return;

      setIsHydrating(true);

      let s: Partial<CalculatorSnapshot> = {};
      try {
        s = (await apiSelectState(
          projectId,
        )) as Partial<CalculatorSnapshot>;
      } catch (error) {
        console.error("Load project failed:", error);
        setIsHydrating(false);
        return;
      }

      if (cancelled) return;

      // Hydrate only the parts your App owns (and leave everything else alone)
      if (s.licenses) setLicenses(s.licenses);
      if (s.cloudStations) setCloudStations(s.cloudStations);
      if (s.physicalStations)
        setPhysicalStations(s.physicalStations);
      if (s.preferredCloud) setPreferredCloud(s.preferredCloud);

      if (typeof s.artistComputeCost === "number")
        setArtistComputeCost(s.artistComputeCost);
      if (typeof s.artistLicensingCost === "number")
        setArtistLicensingCost(s.artistLicensingCost);
      if (typeof s.renderComputeCost === "number")
        setRenderComputeCost(s.renderComputeCost);
      if (typeof s.renderFarmCost === "number")
        setRenderFarmCost(s.renderFarmCost);
      if (typeof s.dataStorageCost === "number")
        setDataStorageCost(s.dataStorageCost);
      if (typeof s.dataEgressCost === "number")
        setDataEgressCost(s.dataEgressCost);
      if (typeof s.activeArtistStations === "number")
        setActiveArtistStations(s.activeArtistStations);
      if (typeof s.renderNodeCount === "number")
        setRenderNodeCount(s.renderNodeCount);

      if (typeof s.activeTab === "string")
        setActiveTab(s.activeTab);

      if (typeof (s as any).projectName === "string")
        setProjectName((s as any).projectName);

      if (s.artistTabState) setArtistTabState(s.artistTabState);
      if ((s as any).renderTabState)
        setRenderTabState((s as any).renderTabState);

      setIsHydrating(false);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Debounced autosave whenever snapshot changes
  useEffect(() => {
    if (!projectId) return;
    if (isHydrating) return;
    if (!hasUserEditedRef.current) return;
    // If we just hydrated and haven't edited anything yet, avoid showing "saving" immediately
    // (We'll still save once something changes.)

    // Clear prior pending save
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (!hasUserEditedRef.current) return;
    setSaveStatus("saving");

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await apiUpdateState(projectId, snapshot);
        setSaveStatus("saved");
        setLastSavedAt(Date.now());
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus("error");
      }
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [projectId, isHydrating, snapshot]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Hybrid Cloud Studio Infrastructure Cost
                  Calculator
                </h1>
                <p className="text-gray-600 mt-1">
                  Calculate costs for CG production jobs across
                  physical and cloud resources
                </p>
              </div>
            </div>
            {/* Project name + save status */}
            <div className="flex flex-col items-end gap-2 min-w-[260px]">
              <div className="w-full max-w-[320px]">
                <label className="block text-xs text-gray-500 mb-1">
                  Project Name
                </label>
                <input
                  value={projectName}
                  onChange={(e) =>
                    setProjectName(e.target.value)
                  }
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Untitled Project"
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={[
                    "text-xs px-2 py-1 rounded-full border",
                    saveStatus === "saving"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : saveStatus === "saved"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : saveStatus === "error"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-gray-50 border-gray-200 text-gray-600",
                  ].join(" ")}
                  title={
                    saveStatus === "saving"
                      ? "Saving..."
                      : saveStatus === "saved"
                        ? "Saved"
                        : saveStatus === "error"
                          ? "Save failed"
                          : "Idle"
                  }
                >
                  {saveStatus === "saving"
                    ? "Saving…"
                    : saveStatus === "saved"
                      ? "Saved"
                      : saveStatus === "error"
                        ? "Save failed"
                        : "Not saved yet"}
                </span>

                {lastSavedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(lastSavedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger
              value="artists"
              className="flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span>Artist Costs</span>
            </TabsTrigger>
            <TabsTrigger
              value="render"
              className="flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Render Costs</span>
            </TabsTrigger>
            <TabsTrigger
              value="licensing"
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Licensing</span>
            </TabsTrigger>
            <TabsTrigger
              value="cloud"
              className="flex items-center gap-2"
            >
              <Cloud className="w-4 h-4" />
              <span>Cloud Compute</span>
            </TabsTrigger>
            <TabsTrigger
              value="physical"
              className="flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Physical Stations</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Cost Summary</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artists">
            <ArtistCostsTab
              licenses={licenses}
              physicalStations={physicalStations}
              cloudStations={cloudStations}
              state={artistTabState}
              onStateChange={setArtistTabState}
              onComputeCostChange={(cost) => {
                setArtistComputeCost(cost);
              }}
              onLicensingCostChange={(cost) => {
                setArtistLicensingCost(cost);
              }}
            />
          </TabsContent>

          <TabsContent value="render">
            <RenderCostTab
              cloudStations={cloudStations}
              preferredCloud={preferredCloud}
              onPreferredCloudChange={setPreferredCloud}
              state={renderTabState}
              onStateChange={setRenderTabState}
              onRenderCostChange={(cost) => {
                setRenderFarmCost(cost);
              }}
              onRenderComputeChange={(cost) => {
                setRenderComputeCost(cost);
              }}
              onNodeCountChange={(count) => {
                setRenderNodeCount(count);
              }}
            />
          </TabsContent>

          <TabsContent value="licensing">
            <LicensingTab
              licenses={licenses}
              onUpdate={setLicenses}
            />
          </TabsContent>

          <TabsContent value="cloud">
            <CloudComputeCostTab
              cloudStations={cloudStations}
              onUpdate={setCloudStations}
              activeArtistStations={activeArtistStations}
              renderNodes={renderNodeCount}
              artistComputeCost={artistComputeCost}
              renderComputeCost={renderComputeCost}
            />
          </TabsContent>

          <TabsContent value="physical">
            <PhysicalStationsTab
              stations={physicalStations}
              onUpdate={setPhysicalStations}
            />
          </TabsContent>

          <TabsContent value="summary">
            <CostSummaryBreakdownTab
              artists={artistTabState?.artists || []}
              licenses={licenses}
              cloudStations={cloudStations}
              renderNodeCount={renderNodeCount}
              renderNodeType={renderTabState?.cloudNodeType || ''}
              renderComputeCost={renderComputeCost}
              renderFarmCost={renderFarmCost}
              totalFullRenders={renderTabState?.totalFullRenders || 0}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Persistent Cost Summary Bar */}
      <CostSummaryBar
        computeCosts={artistComputeCost + renderComputeCost}
        dataStorageCosts={dataStorageCost}
        licensingCosts={artistLicensingCost}
        renderFarmCosts={renderFarmCost}
        dataEgressCosts={dataEgressCost}
      />
    </div>
  );
}