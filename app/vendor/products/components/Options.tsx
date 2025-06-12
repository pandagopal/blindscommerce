import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus } from 'lucide-react';

interface OptionsData {
  mountTypes: string[];
  controlTypes: string[];
  fabricTypes: string[];
  headrailOptions: string[];
  bottomRailOptions: string[];
  specialtyOptions: string[];
  // Blinds specific options
  liftSystems: string[];
  slatOptions: string[];
  lightControl: string[];
  // Shades specific options
  operatingSystems: string[];
  opacityLevels: string[];
  cellularStructure: string[];
  energyEfficiency: string[];
}

interface OptionsProps {
  data: OptionsData;
  onChange: (data: OptionsData) => void;
}

export default function Options({ data, onChange }: OptionsProps) {
  const [newOption, setNewOption] = useState<Record<string, string>>({
    mountTypes: '',
    controlTypes: '',
    fabricTypes: '',
    headrailOptions: '',
    bottomRailOptions: '',
    specialtyOptions: '',
    // Blinds specific
    liftSystems: '',
    slatOptions: '',
    lightControl: '',
    // Shades specific
    operatingSystems: '',
    opacityLevels: '',
    cellularStructure: '',
    energyEfficiency: ''
  });

  const addOption = (category: keyof OptionsData) => {
    const value = newOption[category]?.trim();
    if (value && !(data[category] || []).includes(value)) {
      onChange({
        ...data,
        [category]: [...(data[category] || []), value]
      });
      setNewOption(prev => ({ ...prev, [category]: '' }));
    }
  };

  const removeOption = (category: keyof OptionsData, index: number) => {
    onChange({
      ...data,
      [category]: (data[category] || []).filter((_, i) => i !== index)
    });
  };

  const OptionSection = ({ 
    title, 
    category, 
    description 
  }: { 
    title: string; 
    category: keyof OptionsData; 
    description: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Add new ${title.toLowerCase()}`}
            value={newOption[category]}
            onChange={(e) => setNewOption(prev => ({ ...prev, [category]: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addOption(category)}
          />
          <button
            onClick={() => addOption(category)}
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(data[category] || []).map((option, index) => (
            <div key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              <span>{option}</span>
              <button
                onClick={() => removeOption(category, index)}
                className="ml-1 hover:text-red-500 transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        
        {(data[category] || []).length === 0 && (
          <p className="text-sm text-gray-500 italic">No options added yet</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Product Options & Configurations</h3>
        <p className="text-sm text-gray-600 mb-6">
          Define the customization options available for your product
        </p>
      </div>

      <Tabs defaultValue="blinds" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="blinds">Blinds Features</TabsTrigger>
          <TabsTrigger value="shades">Shades Features</TabsTrigger>
          <TabsTrigger value="mounting">Mounting & Controls</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
        </TabsList>

        <TabsContent value="blinds" className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">🪟 Blinds Features</h4>
            <p className="text-sm text-blue-800">Configure options specific to blinds products</p>
          </div>
          
          <OptionSection
            title="Lift Systems"
            category="liftSystems"
            description="String, Motorized, Spring System, Wand System"
          />
          
          <OptionSection
            title="Control Types"
            category="controlTypes"
            description="Cordless, Corded, Smart Controls"
          />
          
          <OptionSection
            title="Slat Options"
            category="slatOptions"
            description="Width variations, materials, textures"
          />
          
          <OptionSection
            title="Light Control"
            category="lightControl"
            description="Room darkening, light filtering, blackout"
          />
        </TabsContent>

        <TabsContent value="shades" className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-green-900 mb-2">🏠 Shades Features</h4>
            <p className="text-sm text-green-800">Configure options specific to shades products</p>
          </div>
          
          <OptionSection
            title="Operating Systems"
            category="operatingSystems"
            description="Continuous cord loop, cordless, motorized"
          />
          
          <OptionSection
            title="Opacity Levels"
            category="opacityLevels"
            description="Sheer, semi-opaque, blackout"
          />
          
          <OptionSection
            title="Cellular Structure"
            category="cellularStructure"
            description="Single cell, double cell, triple cell"
          />
          
          <OptionSection
            title="Energy Efficiency"
            category="energyEfficiency"
            description="Insulating properties, R-values"
          />
        </TabsContent>

        <TabsContent value="mounting" className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-purple-900 mb-2">🔧 Mounting & Installation</h4>
            <p className="text-sm text-purple-800">Basic mounting and control options</p>
          </div>
          
          <OptionSection
            title="Mount Types"
            category="mountTypes"
            description="Inside Mount, Outside Mount, Ceiling Mount"
          />
          
          <OptionSection
            title="Fabric Types"
            category="fabricTypes"
            description="Available fabric materials and patterns"
          />
        </TabsContent>

        <TabsContent value="hardware" className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-orange-900 mb-2">⚙️ Hardware Components</h4>
            <p className="text-sm text-orange-800">Headrail, bottom rail, and specialty options</p>
          </div>
          
          <OptionSection
            title="Headrail Options"
            category="headrailOptions"
            description="Headrail styles and configurations"
          />
          
          <OptionSection
            title="Bottom Rail Options"
            category="bottomRailOptions"
            description="Bottom rail styles and weights"
          />
          
          <OptionSection
            title="Specialty Options"
            category="specialtyOptions"
            description="Special features and add-ons"
          />
        </TabsContent>
      </Tabs>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">💡 Quick Start Examples</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-900 mb-2">🪟 Blinds Examples:</h5>
            <ul className="text-blue-800 space-y-1">
              <li><strong>Lift Systems:</strong> String, Motorized, Spring System</li>
              <li><strong>Slat Options:</strong> 1", 2", Wood, Faux Wood, Aluminum</li>
              <li><strong>Light Control:</strong> Room Darkening, Light Filtering</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-green-900 mb-2">🏠 Shades Examples:</h5>
            <ul className="text-green-800 space-y-1">
              <li><strong>Operating Systems:</strong> Cordless, Motorized, Continuous Loop</li>
              <li><strong>Opacity:</strong> Sheer, Semi-Opaque, Blackout</li>
              <li><strong>Cellular:</strong> Single Cell, Double Cell, Triple Cell</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}