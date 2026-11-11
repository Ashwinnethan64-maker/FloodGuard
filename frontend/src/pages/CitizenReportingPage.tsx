import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import type { IncidentCategory, WaterDepthCategory, SeverityLevel } from '../types/api';
import { MangaluruMap } from '../components/map/MangaluruMap';
import { 
  Send, 
  MapPin, 
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
import { Card, Button } from '../components/ui';

export const CitizenReportingPage = () => {
  const navigate = useNavigate();

  const [locationName, setLocationName] = useState('');
  const [incidentCategory, setIncidentCategory] = useState<IncidentCategory>('ROAD_INUNDATION');
  const [description, setDescription] = useState('');
  const [waterDepth, setWaterDepth] = useState<WaterDepthCategory>('ANKLE_DEEP');
  const [severity, setSeverity] = useState<SeverityLevel>('MEDIUM');
  const [observedTime, setObservedTime] = useState(() => new Date().toISOString().slice(0, 16));
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

      let finalImageUrl = uploadedImageUrl;
      if (imageFile && !finalImageUrl) {
        setUploadingImage(true);
        const uploadRes = await apiClient.uploadIncidentImage(imageFile);
        finalImageUrl = uploadRes.image_url;
        setUploadedImageUrl(finalImageUrl);
        setUploadingImage(false);
      }

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
    <div className="max-w-4xl w-full mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-light text-[#061b31] tracking-tight">
              Citizen Flood Incident Reporting
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff] uppercase tracking-wider shrink-0">
              Verification Triage
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
            Report active road waterlogging, underpass inundation, or debris hazards across Mangaluru
          </p>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-sm bg-white border border-[#e5edf5] text-xs text-[#50617a] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#533afd] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#061b31]">Verification & Public Safety Protocol:</strong> All citizen submissions are initially recorded as <span className="font-semibold underline">PENDING</span> and <span className="font-semibold underline">UNVERIFIED</span>. Automated spatial duplicate detection groups reports for on-duty traffic patrols and the disaster control room.
        </div>
      </div>

      {success ? (
        <Card className="p-10 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-[#059669]" />
          <h2 className="text-lg font-light text-[#061b31]">Incident Submitted Successfully</h2>
          <p className="text-xs text-[#64748d] max-w-md">
            Your report is queued for verification by Mangaluru emergency dispatchers and police patrol units. Redirecting to dashboard...
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-sm bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Category & Perceived Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                  Incident Category *
                </label>
                <select
                  value={incidentCategory}
                  onChange={(e) => setIncidentCategory(e.target.value as IncidentCategory)}
                  className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-2 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd]"
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
                <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                  Perceived Severity *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-2 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd]"
                >
                  <option value="LOW">Low (Slow traffic, shallow puddle)</option>
                  <option value="MEDIUM">Medium (Ankle to knee water, 2W cautioned)</option>
                  <option value="HIGH">High (Cars stalling, lane blocked)</option>
                  <option value="CRITICAL">Critical (Life hazard, fully submerged road)</option>
                </select>
              </div>
            </div>

            {/* Known Hotspots Selector */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-2">
                Quick Select Known Hotspots:
              </label>
              <div className="flex flex-wrap gap-2">
                {presetLocations.map(p => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => handlePresetSelect(p)}
                    className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                      locationName === p.name
                        ? 'bg-[#533afd] text-white border-[#533afd]'
                        : 'bg-[#f8fafd] text-[#50617a] border-[#e5edf5] hover:bg-[#e8e9ff]'
                    }`}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Name */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                Location / Road Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NH-66 Kottara Chowki Flyover Underpass"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd]"
              />
            </div>

            {/* Coordinates & Map Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#061b31]">
                  Geographic Coordinates (WGS84)
                </label>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="text-xs text-[#533afd] hover:underline flex items-center gap-1 font-medium"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{showMapPicker ? 'Close Map Picker' : 'Pick Location on Map'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#64748d] block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-1.5 text-xs text-[#061b31] font-mono focus:outline-none focus:border-[#533afd]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748d] block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-1.5 text-xs text-[#061b31] font-mono focus:outline-none focus:border-[#533afd]"
                  />
                </div>
              </div>

              {showMapPicker && (
                <div className="mt-2 rounded-sm overflow-hidden border border-[#533afd]">
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
              <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                Time of Observation
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#64748d] absolute left-3 top-2.5" />
                <input
                  type="datetime-local"
                  value={observedTime}
                  onChange={(e) => setObservedTime(e.target.value)}
                  className="w-full bg-white border border-[#e5edf5] rounded-sm pl-9 pr-3 py-2 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd]"
                />
              </div>
            </div>

            {/* Water Depth Level */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-2">
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
                    className={`p-3 rounded-sm border text-left flex flex-col justify-between transition-colors ${
                      waterDepth === d.id
                        ? 'bg-[#e8e9ff] border-[#533afd] text-[#533afd]'
                        : 'bg-white border-[#e5edf5] text-[#50617a] hover:bg-[#f8fafd]'
                    }`}
                  >
                    <span className="text-xs font-semibold block">{d.label}</span>
                    <span className="text-[10px] text-[#64748d] mt-1">{d.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Passability Toggles */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-2">
                Vehicle Passability Assessment
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <label className={`p-3 rounded-sm border flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 cursor-pointer transition-colors touch-manipulation ${
                  passable2W ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]' : 'bg-[#f8fafd] border-[#e5edf5] text-[#94a3b8]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Bike className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">2-Wheelers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={passable2W}
                    onChange={(e) => setPassable2W(e.target.checked)}
                    className="rounded-[2px] accent-[#059669] w-4 h-4"
                  />
                </label>

                <label className={`p-3 rounded-sm border flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 cursor-pointer transition-colors touch-manipulation ${
                  passable4W ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]' : 'bg-[#f8fafd] border-[#e5edf5] text-[#94a3b8]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">4-Wheelers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={passable4W}
                    onChange={(e) => setPassable4W(e.target.checked)}
                    className="rounded-[2px] accent-[#059669] w-4 h-4"
                  />
                </label>

                <label className={`p-3 rounded-sm border flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 cursor-pointer transition-colors touch-manipulation ${
                  passableEmergency ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]' : 'bg-[#f8fafd] border-[#e5edf5] text-[#94a3b8]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">Emergency Vehicles</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={passableEmergency}
                    onChange={(e) => setPassableEmergency(e.target.checked)}
                    className="rounded-[2px] accent-[#059669] w-4 h-4"
                  />
                </label>
              </div>
            </div>

            {/* Photograph Upload */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                Photograph Verification (Optional, Max 10MB)
              </label>
              
              {imagePreview ? (
                <div className="relative rounded-sm overflow-hidden border border-[#e5edf5] w-full sm:w-64 h-40 bg-[#f8fafd]">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-white/90 rounded-sm text-[#dc2626] hover:bg-white shadow-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#e5edf5] hover:border-[#533afd] rounded-sm p-6 text-center cursor-pointer transition-colors flex flex-col items-center gap-1.5 bg-[#f8fafd]"
                >
                  <Upload className="w-6 h-6 text-[#64748d]" />
                  <span className="text-xs font-medium text-[#061b31]">Click to upload incident photo</span>
                  <span className="text-[10px] text-[#64748d]">JPG, PNG, WebP up to 10MB</span>
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
              <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                Incident Details / Visual Indicators
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Storm drain blocked near underpass, small cars stalled in knee-deep water"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd]"
              />
            </div>

            {/* Reporter Identification */}
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-1.5">
                Reporter Name / Call-sign (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Local Citizen / Traffic Commuter"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-white border border-[#e5edf5] rounded-sm px-3 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd]"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || uploadingImage}
              size="lg"
              className="w-full justify-center"
            >
              <Send className="w-4 h-4" />
              <span>{submitting || uploadingImage ? 'Submitting Report...' : 'Submit Incident to Emergency Dispatchers'}</span>
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};
