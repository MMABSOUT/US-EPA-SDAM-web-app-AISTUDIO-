import React, { useState } from 'react';
import { SdamRegion, Coordinates, ModelPrediction, AssessmentMetadata, AssessmentPhoto } from './types/sdam';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Step1Location } from './components/Step1Location';
import { Step2Indicators } from './components/Step2Indicators';
import { Step3Report } from './components/Step3Report';

export function App() {
  const [selectedRegion, setSelectedRegion] = useState<SdamRegion | null>('Great Plains');
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 40.0, lon: -98.0 });
  const [adjacentRegions, setAdjacentRegions] = useState<SdamRegion[]>([]);
  const [prediction, setPrediction] = useState<ModelPrediction | null>(null);

  // Indicators state
  const [indicatorInputs, setIndicatorInputs] = useState<Record<string, any>>({
    user_total_abundance: 2,
    user_hydrophyte: 1,
    user_upland_rooted: 1,
    user_diff_veg: 2.0,
    user_riff_pool: 2.0,
    user_substrate: 1.5,
    user_sediment_plants: 0.75,
    user_slope: 3.5,
    user_shade: 50,
    user_er: 1.65,
    user_bmi: 2,
    user_drainage: 0.5,
    user_aquatic_presence: 'Yes',
    user_ephemeroptera: 'Yes',
    user_per_taxa: 'Yes',
    user_plants: 'Yes',
    user_fish: 'No',
    user_amphibians: 'No',
    user_eph_isa: 2,
    user_algal_cover: 2,
    user_roots: 2,
  });

  // Step 3 metadata
  const [metadata, setMetadata] = useState<AssessmentMetadata>({
    project: '',
    code: '',
    assessor: '',
    waterway: '',
    date: new Date().toISOString().split('T')[0],
    weatherCondition: 'Clear/Sunny',
    weatherNotes: '',
    reachLength: '35 m',
    flowState: 'Flowing water',
    surroundingLandUse: 'Riparian / Forested',
    disturbances: 'None observed',
    notes: '',
  });

  const [photos, setPhotos] = useState<AssessmentPhoto[]>([]);

  const scrollToStep2 = () => {
    const el = document.getElementById('step2-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fa] text-gray-900 font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* App Title Header */}
        <div className="bg-white border-l-8 border-[#005ea2] shadow-sm p-6 mb-8 rounded-r">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Web application for the Regional Streamflow Duration Assessment Methods (SDAMs)
          </h1>
          <p className="text-sm text-gray-600 mt-2 flex flex-wrap items-center gap-2">
            <span>Version <strong className="text-[#005ea2]">3.0.1</strong></span>
            <span className="text-gray-400">•</span>
            <span>Release date: <strong>October 2025</strong></span>
            <span className="text-gray-400">•</span>
            <span>U.S. Environmental Protection Agency</span>
          </p>
        </div>

        {/* Step 1: Reach Location & Region Selection */}
        <Step1Location
          selectedRegion={selectedRegion}
          onSelectRegion={(reg) => {
            setSelectedRegion(reg);
            setPrediction(null); // Reset prediction when region changes
          }}
          coordinates={coordinates}
          onCoordinatesChange={setCoordinates}
          adjacentRegions={adjacentRegions}
          onAdjacentRegionsChange={setAdjacentRegions}
          onProceedToStep2={scrollToStep2}
        />

        {/* Step 2: Regional Indicators & Model Execution */}
        {selectedRegion && (
          <Step2Indicators
            region={selectedRegion}
            coordinates={coordinates}
            prediction={prediction}
            onPredictionChange={setPrediction}
            indicatorInputs={indicatorInputs}
            onIndicatorInputsChange={setIndicatorInputs}
          />
        )}

        {/* Step 3: (Optional) Report Generation */}
        {selectedRegion && (
          <Step3Report
            region={selectedRegion}
            coordinates={coordinates}
            prediction={prediction}
            adjacentRegions={adjacentRegions}
            indicatorInputs={indicatorInputs}
            metadata={metadata}
            onMetadataChange={setMetadata}
            photos={photos}
            onPhotosChange={setPhotos}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
