'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import RiskBadge from '@/components/RiskBadge';
import SummaryCard from '@/components/SummaryCard';
import { RefreshCw, Search, Wrench, AlertTriangle, CheckCircle2, ShieldAlert, ArrowUpDown, Inbox } from 'lucide-react';

/**
 * Renders a badge showing whether a vehicle is actively being serviced
 * by a mechanic (Maintenance) or running normally (Active).
 */
function ServiceStatusBadge({ vehicleStatus }: { vehicleStatus: string }) {
  if (vehicleStatus === 'Maintenance') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <Wrench className="w-3.5 h-3.5 animate-pulse" />
        In Service
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Active
    </span>
  );
}

export default function PredictiveMaintenance() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortByDistance, setSortByDistance] = useState('NONE');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = api.auth.getLocalUser();
    if (user?.role !== 'Fleet Manager' && user?.role !== 'Manager' && user?.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }
    fetchReport();
  }, [router]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vData, rData, sData] = await Promise.all([
        api.vehicles.getAll(),
        api.risks.getAll().catch(() => []),
        api.services.getAll().catch(() => [])
      ]);
      
      const allVehicles = vData || [];
      const backendRisks = rData || [];
      const liveServices = Array.isArray(sData) ? sData : (sData as any)?.records || [];
      
      // Map backend maintenance risks directly to vehicles
      const mappedVehicles = allVehicles.map((v: any) => {
        const riskObj = backendRisks.find((r: any) => r.vehicle_id === v.id);
        const vServices = liveServices.filter((s: any) => s.vehicle_id === v.id);
        vServices.sort((a: any, b: any) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
        const lastService = vServices[0];
        
        const last_service_mileage = riskObj ? Number(riskObj.last_service_mileage) : (lastService ? Number(lastService.current_mileage) : 0);
        const distance = riskObj && riskObj.remaining_distance !== undefined 
          ? Math.max(0, (v.current_mileage || 0) - last_service_mileage)
          : Math.max(0, (v.current_mileage || 0) - last_service_mileage);
        
        let risk_level = (riskObj?.risk_level || v.maintenance_status || v.maintenance_risk || 'Low').toUpperCase();

        return {
          ...v,
          lastServiceMileage: last_service_mileage,
          distanceSinceLastService: distance,
          risk: risk_level,
          summary: riskObj?.summary || null,
          vehicleStatus: v.status || 'Active'
        };
      });

      setVehicles(mappedVehicles);
    } catch (err: any) {
      setError('Failed to load predictive risk data');
    } finally {
      setLoading(false);
    }
  };

  const totalVehicles   = vehicles.length;
  const lowRiskCount    = vehicles.filter(v => v.risk === 'LOW').length;
  const mediumRiskCount = vehicles.filter(v => v.risk === 'MEDIUM').length;
  const highRiskCount   = vehicles.filter(v => v.risk === 'HIGH').length;
  const inServiceCount  = vehicles.filter(v => v.vehicleStatus === 'Maintenance').length;

  const processedVehicles = vehicles
    .filter(vehicle => {
      const matchesSearch = (vehicle.vehicle_number || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesRisk   = riskFilter === 'ALL' || vehicle.risk === riskFilter;
      const matchesService =
        serviceFilter === 'ALL' ||
        (serviceFilter === 'IN_SERVICE' && vehicle.vehicleStatus === 'Maintenance') ||
        (serviceFilter === 'ACTIVE'     && vehicle.vehicleStatus !== 'Maintenance');
      return matchesSearch && matchesRisk && matchesService;
    })
    .sort((a, b) => {
      if (sortByDistance === 'ASC') return a.distanceSinceLastService - b.distanceSinceLastService;
      if (sortByDistance === 'DESC') return b.distanceSinceLastService - a.distanceSinceLastService;
      return 0;
    });

  const toggleSort = () => {
    if (sortByDistance === 'NONE') setSortByDistance('DESC');
    else if (sortByDistance === 'DESC') setSortByDistance('ASC');
    else setSortByDistance('NONE');
  };

  const inputClass = "border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";

  return (
    <LayoutWrapper>
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 p-6 md:p-8 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">FleetGuard</p>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Predictive Maintenance Engine</h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor vehicle maintenance risk based on mileage and service logs.
              {inServiceCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-semibold">
                  <Wrench className="w-3.5 h-3.5 animate-pulse" />
                  {inServiceCount} vehicle{inServiceCount > 1 ? 's' : ''} currently being serviced.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard title="Total Vehicles" value={loading ? '...' : totalVehicles}    icon={<Wrench className="w-5 h-5" />}        variant="primary" />
          <SummaryCard title="Low Risk"       value={loading ? '...' : lowRiskCount}     icon={<CheckCircle2 className="w-5 h-5" />}  variant="success" />
          <SummaryCard title="Medium Risk"    value={loading ? '...' : mediumRiskCount}  icon={<AlertTriangle className="w-5 h-5" />} variant="warning" />
          <SummaryCard title="High Risk"      value={loading ? '...' : highRiskCount}    icon={<ShieldAlert className="w-5 h-5" />}   variant="danger" />
          <SummaryCard
            title="In Service Now"
            value={loading ? '...' : inServiceCount}
            icon={<Wrench className="w-5 h-5" />}
            variant="warning"
          />
        </div>

        {/* Rule-Based Threshold Engine Info Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 tracking-wider">
                Rule-Based Risk Signal
              </span>
              <h3 className="text-sm font-bold text-white">Mileage & Interval Threshold Engine</h3>
            </div>
            <p className="text-xs text-slate-300">
              Evaluates current mileage against last service records and recommended maintenance intervals (<span className="text-emerald-400 font-semibold">10,000 km</span> standard / <span className="text-amber-300 font-semibold">7,500 km</span> for vehicles &gt;5 years old).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold shrink-0 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Low (&gt;1,000 km)
            </div>
            <div className="flex items-center gap-1.5 text-amber-300">
              <div className="w-2 h-2 rounded-full bg-amber-300"></div> Med (&le;1,000 km)
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <div className="w-2 h-2 rounded-full bg-rose-400"></div> High (&le;0 km)
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative flex-1 max-w-lg w-full">
            <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by license plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} w-full pl-9 pr-4 py-2.5`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Risk:</span>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className={`${inputClass} px-3 py-2`}>
                <option value="ALL">All Risks</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Service:</span>
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={`${inputClass} px-3 py-2`}>
                <option value="ALL">All Vehicles</option>
                <option value="IN_SERVICE">In Service Now</option>
                <option value="ACTIVE">Active Only</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sort Distance:</span>
              <select value={sortByDistance} onChange={(e) => setSortByDistance(e.target.value)} className={`${inputClass} px-3 py-2`}>
                <option value="NONE">Unsorted</option>
                <option value="DESC">Highest First</option>
                <option value="ASC">Lowest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Calculating mileage risks...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-semibold text-sm">Failed to Load Maintenance Report</h3>
              <p className="text-red-600 text-xs mt-1">{error}</p>
              <button onClick={fetchReport} className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all">
                Try Again
              </button>
            </div>
          </div>
        ) : processedVehicles.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <div className="p-3 bg-slate-100 rounded-full">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-bold text-base">No Vehicles Found</h3>
            <p className="text-slate-500 text-xs max-w-xs">No vehicle records matched your search or filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide">License Plate</th>
                    <th className="px-5 py-3.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide">Vehicle Description</th>
                    <th className="px-5 py-3.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide text-right">Current Mileage</th>
                    <th className="px-5 py-3.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide text-right">Last Service Mileage</th>
                    <th className="px-5 py-3.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide text-right">
                      <button onClick={toggleSort} className="inline-flex items-center gap-1.5 ml-auto hover:text-blue-700 transition-colors">
                        Distance Since Service <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide text-center">Risk Level</th>
                    <th className="px-5 py-3.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide text-center">
                      Service Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedVehicles.map((vehicle) => {
                    const hasHistory = vehicle.lastServiceMileage > 0;
                    const isInService = vehicle.vehicleStatus === 'Maintenance';
                    return (
                      <tr
                        key={vehicle.id}
                        className={`transition-colors ${isInService ? 'bg-amber-50/40' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-blue-700">{vehicle.vehicle_number}</td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{vehicle.make}</div>
                          <div className="text-slate-500 text-xs">{vehicle.model}</div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-slate-800">{vehicle.current_mileage?.toLocaleString() || 0} km</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700">
                          {hasHistory ? (
                            <span>{vehicle.lastServiceMileage.toLocaleString()} km</span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No Logs (0 km)</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">{vehicle.distanceSinceLastService.toLocaleString()} km</td>
                        <td className="px-5 py-4 text-center"><RiskBadge risk={vehicle.risk} /></td>
                        <td className="px-5 py-4 text-center">
                          <ServiceStatusBadge vehicleStatus={vehicle.vehicleStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
