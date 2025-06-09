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
    specialtyOptions: ''
  });

  const addOption = (category: keyof OptionsData) => {
    const value = newOption[category]?.trim();
    if (value && !data[category].includes(value)) {
      onChange({
        ...data,
        [category]: [...data[category], value]
      });
      setNewOption(prev => ({ ...prev, [category]: '' }));
    }
  };

  const removeOption = (category: keyof OptionsData, index: number) => {
    onChange({
      ...data,
      [category]: data[category].filter((_, i) => i !== index)
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
          <Button onClick={() => addOption(category)} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {data[category].map((option, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {option}
              <button
                onClick={() => removeOption(category, index)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        {data[category].length === 0 && (
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

      <Tabs defaultValue="mounting" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mounting">Mounting & Controls</TabsTrigger>
          <TabsTrigger value="materials">Materials & Fabrics</TabsTrigger>
          <TabsTrigger value="hardware">Hardware & Specialty</TabsTrigger>
        </TabsList>

        <TabsContent value="mounting" className="space-y-6">
          <OptionSection
            title="Mount Types"
            category="mountTypes"
            description="Different mounting options for installation"
          />
          
          <OptionSection
            title="Control Types"
            category="controlTypes"
            description="Methods for operating the product"
          />
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <OptionSection
            title="Fabric Types"
            category="fabricTypes"
            description="Available fabric materials and patterns"
          />
        </TabsContent>

        <TabsContent value="hardware" className="space-y-6">
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

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Common Options</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Mount Types:</strong> Inside Mount, Outside Mount, Ceiling Mount</p>
          <p><strong>Control Types:</strong> Cordless, Corded, Motorized, Smart Home</p>
          <p><strong>Fabrics:</strong> Light Filtering, Blackout, Sheer, Solar Screen</p>
        </div>
      </div>
    </div>
  );
}