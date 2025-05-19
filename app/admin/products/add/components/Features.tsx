import { useState } from 'react';

interface Feature {
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesProps {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}

export default function Features({ features, onChange }: FeaturesProps) {
  const [featuresList, setFeaturesList] = useState<Feature[]>(features);
  const [newFeature, setNewFeature] = useState<Feature>({
    title: '',
    description: '',
    icon: ''
  });

  const addFeature = () => {
    if (newFeature.title && newFeature.description) {
      const updatedFeatures = [...featuresList, newFeature];
      setFeaturesList(updatedFeatures);
      onChange(updatedFeatures);
      setNewFeature({ title: '', description: '', icon: '' });
    }
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = featuresList.filter((_, i) => i !== index);
    setFeaturesList(updatedFeatures);
    onChange(updatedFeatures);
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const updatedFeatures = featuresList.map((feature, i) =>
      i === index ? { ...feature, [field]: value } : feature
    );
    setFeaturesList(updatedFeatures);
    onChange(updatedFeatures);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Add New Feature</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Feature Title"
            value={newFeature.title}
            onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
            className="border rounded-lg px-4 py-2"
          />
          <input
            type="text"
            placeholder="Icon (optional)"
            value={newFeature.icon}
            onChange={(e) => setNewFeature({ ...newFeature, icon: e.target.value })}
            className="border rounded-lg px-4 py-2"
          />
          <textarea
            placeholder="Feature Description"
            value={newFeature.description}
            onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
            className="border rounded-lg px-4 py-2 md:col-span-2"
            rows={3}
          />
          <button
            onClick={addFeature}
            className="bg-primary-red text-white px-6 py-2 rounded-lg hover:bg-primary-red-dark md:col-span-2"
          >
            Add Feature
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {featuresList.map((feature, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={feature.title}
                onChange={(e) => updateFeature(index, 'title', e.target.value)}
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="text"
                value={feature.icon || ''}
                onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                className="border rounded-lg px-4 py-2"
                placeholder="Icon"
              />
              <textarea
                value={feature.description}
                onChange={(e) => updateFeature(index, 'description', e.target.value)}
                className="border rounded-lg px-4 py-2 md:col-span-2"
                rows={3}
              />
              <button
                onClick={() => removeFeature(index)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 