import React, { useState } from 'react';
import { SdamRegion, ModelPrediction, Coordinates, AssessmentMetadata, AssessmentPhoto } from '../types/sdam';
import { FileText, Printer, Camera, Trash2, CheckCircle, Plus, AlertCircle } from 'lucide-react';

interface Step3Props {
  region: SdamRegion;
  coordinates: Coordinates;
  prediction: ModelPrediction | null;
  adjacentRegions: SdamRegion[];
  indicatorInputs: Record<string, any>;
  metadata: AssessmentMetadata;
  onMetadataChange: (meta: AssessmentMetadata) => void;
  photos: AssessmentPhoto[];
  onPhotosChange: (photos: AssessmentPhoto[]) => void;
}

export const Step3Report: React.FC<Step3Props> = ({
  region,
  coordinates,
  prediction,
  adjacentRegions,
  indicatorInputs,
  metadata,
  onMetadataChange,
  photos,
  onPhotosChange,
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'upstream' | 'downstream' | 'substrate' | 'indicator' | 'other'>('upstream');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateField = (key: keyof AssessmentMetadata, val: string) => {
    onMetadataChange({
      ...metadata,
      [key]: val,
    });
  };

  // Security: Enforce allowed MIME types and max size to prevent memory exhaustion DoS & invalid payloads
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const MAX_PHOTOS_COUNT = 10;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= MAX_PHOTOS_COUNT) {
      setUploadError(`Maximum limit of ${MAX_PHOTOS_COUNT} photos reached.`);
      e.target.value = '';
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are permitted.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File size exceeds the 5 MB limit.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newPhoto: AssessmentPhoto = {
        id: Date.now().toString(),
        url: reader.result as string,
        caption: photoCaption || file.name,
        category: photoCategory,
      };
      onPhotosChange([...photos, newPhoto]);
      setPhotoCaption('');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (id: string) => {
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="step3-container" className="bg-white border border-gray-300 rounded shadow-sm p-6 mb-12">
      <div className="flex items-center space-x-2 mb-4">
        <span className="step-badge">Step 3</span>
        <h2 className="text-xl font-bold text-gray-900">
          (optional) Enter additional information and generate a report
        </h2>
      </div>

      <div className="border border-gray-300 rounded p-5 bg-white mb-6">
        <h3 className="text-lg font-bold text-gray-900 underline mb-4 text-center">
          {region} SDAM Assessment Report Information
        </h3>
        <p className="text-xs text-gray-600 mb-6 text-center">
          Enter general site details and optional photographs. No personal or location data is stored permanently.
        </p>

        {/* General Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Project Name or Number:</label>
            <input
              type="text"
              value={metadata.project}
              onChange={(e) => updateField('project', e.target.value)}
              placeholder="e.g. Mill Creek Assessment 2026"
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Site Code or Identifier:</label>
            <input
              type="text"
              value={metadata.code}
              onChange={(e) => updateField('code', e.target.value)}
              placeholder="e.g. MC-Reach-04"
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Assessor(s):</label>
            <input
              type="text"
              value={metadata.assessor}
              onChange={(e) => updateField('assessor', e.target.value)}
              placeholder="e.g. J. Doe, E. Smith"
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Waterway Name:</label>
            <input
              type="text"
              value={metadata.waterway}
              onChange={(e) => updateField('waterway', e.target.value)}
              placeholder="e.g. Unnamed tributary to Bear River"
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Visit Date:</label>
            <input
              type="date"
              value={metadata.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Current Weather Conditions:</label>
            <select
              value={metadata.weatherCondition}
              onChange={(e) => updateField('weatherCondition', e.target.value)}
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            >
              <option value="Clear/Sunny">Clear / Sunny</option>
              <option value="Cloudy">Cloudy</option>
              <option value="Intermittent Rain">Intermittent Rain</option>
              <option value="Steady Rain">Steady Rain</option>
              <option value="Storm/Heavy Rain">Storm / Heavy Rain</option>
              <option value="Snowing">Snowing</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Notes on current or recent weather conditions (e.g. precipitation in last 48 hours):
          </label>
          <textarea
            rows={2}
            value={metadata.weatherNotes}
            onChange={(e) => updateField('weatherNotes', e.target.value)}
            className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            placeholder="Dry conditions for past 7 days; seasonal baseflow."
          />
        </div>

        {/* Reach characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reach Length (m):</label>
            <input
              type="text"
              value={metadata.reachLength}
              onChange={(e) => updateField('reachLength', e.target.value)}
              placeholder="e.g. 35 to 40 m"
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Flow State Observed:</label>
            <select
              value={metadata.flowState}
              onChange={(e) => updateField('flowState', e.target.value)}
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            >
              <option value="Flowing water">Flowing water</option>
              <option value="Standing pools">Standing pools</option>
              <option value="Trickle">Trickle / sub-surface interstitial flow</option>
              <option value="Dry channel">Dry channel</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Surrounding Land Use (100 m):</label>
            <input
              type="text"
              value={metadata.surroundingLandUse}
              onChange={(e) => updateField('surroundingLandUse', e.target.value)}
              placeholder="Forest, Agriculture, Range"
              className="w-full border border-gray-400 p-2 rounded text-sm bg-white"
            />
          </div>
        </div>

        {/* Site Photographs section */}
        <div className="border-t border-gray-300 pt-5 mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-1.5">
            <Camera className="w-4 h-4 text-[#005ea2]" />
            <span>Site Photographs (optional)</span>
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Attach reach photos (e.g., looking upstream, downstream, substrate sorting, indicator plants).
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 border border-gray-300 rounded">
            <select
              value={photoCategory}
              onChange={(e) => setPhotoCategory(e.target.value as any)}
              className="border border-gray-400 p-1.5 text-xs rounded bg-white"
            >
              <option value="upstream">Upstream View</option>
              <option value="downstream">Downstream View</option>
              <option value="substrate">Streambed Substrate</option>
              <option value="indicator">Biological Indicator</option>
              <option value="other">Other Reach Feature</option>
            </select>
            <input
              type="text"
              placeholder="Photo caption / description"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              className="border border-gray-400 p-1.5 text-xs rounded bg-white flex-1 min-w-[180px]"
            />
            <label className="epa-btn-primary text-xs py-1.5 px-3 cursor-pointer flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Choose photo</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          {uploadError && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-300 text-red-700 text-xs rounded flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="relative border border-gray-300 rounded overflow-hidden group bg-gray-100">
                  <img src={p.url} alt={p.caption} className="w-full h-28 object-cover" />
                  <div className="p-1.5 text-[11px] text-gray-700 bg-white">
                    <span className="font-semibold block truncate">{p.caption}</span>
                    <span className="text-gray-500 capitalize">{p.category}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate / Preview Report Button */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="epa-btn-primary text-base py-3 px-8 cursor-pointer shadow-md inline-flex items-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Generate &amp; Preview PDF Report</span>
          </button>
        </div>
      </div>

      {/* REPORT PREVIEW MODAL / PRINTABLE CERTIFICATE */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#1a4480] text-white rounded-t-lg no-print">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-lg">Streamflow Duration Assessment Method Report</h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="text-white hover:text-gray-200 text-sm font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-gray-900 bg-white" id="printable-report">
              {/* Official EPA Banner header */}
              <div className="border-4 border-[#005ea2] p-6 text-center bg-blue-50/50 rounded">
                <div className="flex justify-center mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#005ea2]">
                    U.S. Environmental Protection Agency
                  </span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 uppercase">
                  Streamflow Duration Assessment Method Report
                </h1>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  SDAM Version 3.0.1 (Release Date: October 2025)
                </p>
                <p className="text-xs text-blue-700 underline mt-0.5">
                  https://www.epa.gov/streamflow-duration-assessment
                </p>

                <div className="mt-4 pt-3 border-t border-blue-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Visit Date:</span>
                    <strong className="text-gray-900">{metadata.date || 'Not Provided'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Project:</span>
                    <strong className="text-gray-900">{metadata.project || 'Not Provided'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Site Code:</span>
                    <strong className="text-gray-900">{metadata.code || 'Not Provided'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Report Generated:</span>
                    <strong className="text-gray-900">{new Date().toISOString().split('T')[0]}</strong>
                  </div>
                </div>

                {/* Final classification highlight */}
                <div className="mt-5 p-3.5 bg-[#005ea2] text-white rounded text-center">
                  <span className="text-xs uppercase tracking-wider text-blue-200 block font-bold">
                    {region} Regional SDAM Classification
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-wide text-yellow-300 mt-1 uppercase">
                    {prediction ? prediction.classification : 'ASSESSMENT INCOMPLETE'}
                  </div>
                  {prediction && (
                    <div className="text-xs text-blue-100 mt-1">
                      Probability scores: Perennial: {Math.round(prediction.probabilities.P * 100)}% | Intermittent: {Math.round(prediction.probabilities.I * 100)}% | Ephemeral: {Math.round(prediction.probabilities.E * 100)}%
                    </div>
                  )}
                </div>
              </div>

              {/* General Site Information */}
              <div>
                <h3 className="font-bold text-base border-b-2 border-gray-400 pb-1 mb-3 text-gray-900">
                  1. General Site Information
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50 w-1/3">Project Name/Number:</td>
                      <td className="p-2">{metadata.project || 'Not Provided'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Site Identifier:</td>
                      <td className="p-2">{metadata.code || 'Not Provided'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Regional SDAM:</td>
                      <td className="p-2 font-semibold text-[#005ea2]">{region}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Coordinates (WGS84):</td>
                      <td className="p-2">
                        {coordinates.lat ? `${coordinates.lat}°N, ${coordinates.lon}°W` : 'Not Provided'}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Adjacent SDAM Regions within 10 miles:</td>
                      <td className="p-2">{adjacentRegions.length > 0 ? adjacentRegions.join(', ') : 'None'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Assessor(s):</td>
                      <td className="p-2">{metadata.assessor || 'Not Provided'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Waterway Name:</td>
                      <td className="p-2">{metadata.waterway || 'Not Provided'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Observed Flow State:</td>
                      <td className="p-2">{metadata.flowState}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold bg-gray-50">Weather Conditions:</td>
                      <td className="p-2">
                        {metadata.weatherCondition} {metadata.weatherNotes && `— ${metadata.weatherNotes}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-gray-50">Reach Length &amp; Land Use:</td>
                      <td className="p-2">
                        Length: {metadata.reachLength || 'Standard reach (~35 m)'} | Land Use: {metadata.surroundingLandUse || 'Undeveloped'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Field Indicators & Scores */}
              <div>
                <h3 className="font-bold text-base border-b-2 border-gray-400 pb-1 mb-3 text-gray-900">
                  2. Regional Indicator Values
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-gray-700">
                    <tr>
                      <th className="p-2 text-left font-bold">Indicator Metric</th>
                      <th className="p-2 text-left font-bold">Value / Observed State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(indicatorInputs).map(([k, val]) => (
                      <tr key={k} className="border-b border-gray-200">
                        <td className="p-2 font-mono text-gray-700">{k.replace('user_', '').replace(/_/g, ' ')}</td>
                        <td className="p-2 font-semibold text-gray-900">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Photos in report */}
              {photos.length > 0 && (
                <div className="page-break">
                  <h3 className="font-bold text-base border-b-2 border-gray-400 pb-1 mb-3 text-gray-900">
                    3. Reach Photographs
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((p) => (
                      <div key={p.id} className="border border-gray-300 rounded p-2 text-center bg-gray-50">
                        <img src={p.url} alt={p.caption} className="w-full h-44 object-cover rounded mb-2" />
                        <span className="text-xs font-bold text-gray-900 block">{p.caption}</span>
                        <span className="text-[11px] text-gray-500 capitalize">{p.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regulatory Notice & Signature */}
              <div className="border-t border-gray-300 pt-4 text-xs text-gray-500 space-y-3">
                <p>
                  <strong>Disclaimer:</strong> This classification report is produced using U.S. EPA Regional Streamflow Duration Assessment Method (SDAM) version 3.0.1 random forest and decision tree algorithms. Streamflow classifications provide guidance regarding hydrologic permanence for Clean Water Act and water resource evaluations.
                </p>
                <div className="pt-6 flex justify-between text-xs text-gray-600">
                  <div className="w-60 border-t border-gray-400 pt-1">
                    <span>Assessor Signature</span>
                  </div>
                  <div className="w-40 border-t border-gray-400 pt-1">
                    <span>Date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
