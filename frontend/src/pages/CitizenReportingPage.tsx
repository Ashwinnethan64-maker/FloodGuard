import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import type { IncidentCategory, WaterDepthCategory, SeverityLevel } from '../types/api';
import { MangaluruMap } from '../components/map/MangaluruMap';
import { 
  Send, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Car,
  Bike,
  Truck,
  Upload,
  Clock,
  X
} from 'lucide-react';

export const CitizenReportingPage = () => {
  const navigate = useNavigate();

  const [locationName, setLocationName] = useState('');
  const [incidentCategory, setIncidentCategory] = useState<IncidentCategory>('ROAD_INUNDATION');
  const [description, setDescription] = useState('');
  const [waterDepth, setWaterDepth] = useState<WaterDepthCategory>('ANKLE_DEEP');
  const [severity, setSeverity] = useState<SeverityLevel>('MEDIUM');
  const [observedTime, setObservedTime] = useState(new Date().toISOString().slice(0, 16));
  const [passable2W, setPassable2W] = useState(true);
  const [passable4W, setPassable4W] = useState(true);
  const [passableEmergency, setPassableEmergency] = useState(true);
  const [latitude, setLatitude] = useState(12.8980);
  const [longitude, setLongitude] = useState(74.8450);
  const [reporterName, setReporterName] = useState('');
  
  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const presetLocations = [
    { name: 'Kuntikan Junction Cross', lat: 12.8980, lon: 74.8450 },
    { name: 'Kottara Chowki Flyover Underpass', lat: 12.9050, lon: 74.8445 },
    { name: 'Pumpwell Circle (Mahaveera)', lat: 12.8625, lon: 74.8695 },
    { name: 'State Bank Service Bus Stand', lat: 12.8635, lon: 74.8410 },
    { name: 'Baikampady Industrial Estate', lat: 12.9570, lon: 74.8175 },
    { name: 'Car Street Temple Square', lat: 12.8725, lon: 74.8455 },
  ];

  const handlePresetSelect = (preset: typeof presetLocations[0]) => {
    setLocationName(preset.name);
    setLatitude(preset.lat);
    setLongitude(preset.lon);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (.jpg, .png, .webp).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file exceeds maximum limit of 10MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) {
      setError('Please provide a specific road or corridor name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Upload photo if selected
      let finalImageUrl = uploadedImageUrl;
      if (imageFile && !finalImageUrl) {
        setUploadingImage(true);
        const uploadRes = await apiClient.uploadIncidentImage(imageFile);
        finalImageUrl = uploadRes.image_url;
        setUploadedImageUrl(finalImageUrl);
        setUploadingImage(false);
      }

      // 2. Submit citizen incident report
      await apiClient.submitIncident({
        location_name: locationName,
        incident_category: incidentCategory,
        description,
        reported_water_depth: waterDepth,
        severity,
        observed_time: observedTime,
        passable_two_wheelers: passable2W,
        passable_four_wheelers: passable4W,
        passable_emergency_vehicles: passableEmergency,
        latitude,
        longitude,
        image_url: finalImageUrl || undefined,
        reporter_name: reporterName || 'Anonymous Commuter'
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please check server connection.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-white">Citizen Flood Incident Reporting</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Report active road waterlogging, underpass inundation, or debris hazards across Mangaluru
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/60 text-xs text-purple-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-purple-300">Safety & Verification Protocol:</strong> All citizen submissions are initially tagged as <span className="font-bold underline">PENDING</span> and <span className="font-bold underline">UNVERIFIED</span>. Automated spatial duplicate detection assists emergency dispatchers in grouping reports without discarding citizen inputs.
        </div>
      </div>

      {success ? (
        <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
          <h2 className="text-lg font-bold text-white">Incident Reported Successfully!</h2>
          <p className="text-xs text-slate-400">
            Your report is queued for verification by Mangaluru emergency dispatchers. Redirecting to dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Incident Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Incident Category *
              </label>
              <select
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value as IncidentCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ROAD_INUNDATION">Road Inundation / Surface Runoff</option>
                <option value="UNDERPASS_FLOODING">Underpass / Flyover Flooding</option>
                <option value="DRAIN_OVERFLOW">Stormwater Drain Overflow / Blockage</option>
                <option value="LANDSLIDE_MUDSLIDE">Landslide / Mudslide Hazard</option>
                <option value="TREE_FALL_HAZARD">Tree Fall / Road Obstruction</option>
                <option value="RIVER_BACKFLOW">River Backflow (Gurupura / Nethravathi)</option>
                <option value="GENERAL_WATERLOGGING">General Waterlogging</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Perceived Severity *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">Low (Slow traffic, shallow puddle)</option>
                <option value="MEDIUM">Medium (Ankle to knee water, 2W cautioned)</option>
                <option value="HIGH">High (Cars stalling, lane blocked)</option>
                <option value="CRITICAL">Critical (Life hazard, fully submerged road)</option>
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select or Jump to Known Hotspots:
            </label>
            <div className="flex flex-wrap gap-2">
              {presetLocations.map(p => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => handlePresetSelect(p)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    locationName === p.name
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Location Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Location / Road Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NH-66 Kottara Chowki Flyover Underpass"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Coordinates & Map Picker Toggle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Geographic Coordinates (WGS84)
              </label>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{showMapPicker ? 'Close Map Picker' : 'Pick Location on Map'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {showMapPicker && (
              <div className="mt-2 rounded-xl overflow-hidden border border-cyan-800">
                <MangaluruMap
                  roads={[]}
                  incidents={[]}
                  heightClass="h-[280px]"
                  enableManualLocationPick={true}
                  pickedLocation={{ lat: latitude, lon: longitude }}
                  onLocationPicked={(lat, lon) => {
                    setLatitude(lat);
                    setLongitude(lon);
                  }}
                />
              </div>
            )}
          </div>

          {/* Observed Time */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Time of Observation
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="datetime-local"
                value={observedTime}
                onChange={(e) => setObservedTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Water Depth Level */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Observed Water Depth *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'ANKLE_DEEP', label: 'Ankle Deep (~10cm)', sub: 'Caution for 2W' },
                { id: 'KNEE_DEEP', label: 'Knee Deep (~35cm)', sub: 'Small cars stall' },
                { id: 'WAIST_DEEP', label: 'Waist Deep (~70cm)', sub: 'Impassable' },
                { id: 'SUBMERGED', label: 'Submerged (>1m)', sub: 'Severe danger' },
              ].map(d => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setWaterDepth(d.id as WaterDepthCategory)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    waterDepth === d.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{d.label}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{d.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Passability Toggles */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Vehicle Passability Assessment
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                passable2W ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <Bike className="w-5 h-5" />
                <span className="text-xs font-semibold">2-Wheelers</span>
                <input
                  type="checkbox"
                  checked={passable2W}
                  onChange={(e) => setPassable2W(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
              </label>

              <label className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                passable4W ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <Car className="w-5 h-5" />
                <span className="text-xs font-semibold">4-Wheelers</span>
                <input
                  type="checkbox"
                  checked={passable4W}
                  onChange={(e) => setPassable4W(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
              </label>

              <label className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                passableEmergency ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <Truck className="w-5 h-5" />
                <span className="text-xs font-semibold">Ambulances</span>
                <input
                  type="checkbox"
                  checked={passableEmergency}
                  onChange={(e) => setPassableEmergency(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Photograph Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Photograph Verification (Optional, Max 10MB)
            </label>
            
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 w-full sm:w-64 h-40 bg-slate-950">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-slate-900/80 rounded-full text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center gap-1.5 bg-slate-950/50"
              >
                <Upload className="w-6 h-6 text-slate-500" />
                <span className="text-xs text-slate-300">Click to upload incident photo</span>
                <span className="text-[10px] text-slate-500">JPG, PNG, WebP up to 10MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Incident Details / Visual Indicators
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Storm drain blocked near underpass, small cars stalled in knee-deep water"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Reporter Identification (Privacy Conscious) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Reporter Name / Call-sign (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Local Citizen / Traffic Commuter"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting || uploadingImage ? 'Submitting Report...' : 'Submit Incident to Emergency Dispatchers'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
