'use client';

import { useState } from 'react';
import {
  FormControl,
  FormLabel,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, X } from 'lucide-react';

interface OptionType {
  id: string;
  name: string;
  description?: string;
  priceAdjustment: number;
  isDefault: boolean;
  isActive: boolean;
}

interface OptionsProps {
  data: {
    mountTypes: OptionType[];
    controlTypes: OptionType[];
    fabricTypes: OptionType[];
    headrailOptions: OptionType[];
    bottomRailOptions: OptionType[];
    specialtyOptions: OptionType[];
  };
  onChange: (data: any) => void;
}

export default function Options({ data, onChange }: OptionsProps) {
  const [activeSection, setActiveSection] = useState('mountTypes');

  const handleOptionChange = (section: string, optionId: string, field: string, value: any) => {
    const updatedOptions = data[section].map(option =>
      option.id === optionId ? { ...option, [field]: value } : option
    );
    onChange({ [section]: updatedOptions });
  };

  const addOption = (section: string) => {
    const newOption: OptionType = {
      id: Date.now().toString(),
      name: '',
      description: '',
      priceAdjustment: 0,
      isDefault: false,
      isActive: true
    };
    onChange({ [section]: [...data[section], newOption] });
  };

  const removeOption = (section: string, optionId: string) => {
    const updatedOptions = data[section].filter(option => option.id !== optionId);
    onChange({ [section]: updatedOptions });
  };

  const renderOptionsList = (section: string, title: string) => (
    <div className={`space-y-4 ${activeSection === section ? '' : 'hidden'}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addOption(section)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div className="space-y-4">
        {data[section].map((option) => (
          <Card key={option.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 space-y-4">
                <FormField>
                  <FormItem>
                    <FormLabel>Option Name</FormLabel>
                    <FormControl>
                      <Input
                        value={option.name}
                        onChange={(e) => handleOptionChange(section, option.id, 'name', e.target.value)}
                        placeholder="Enter option name"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>

                <FormField>
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        value={option.description}
                        onChange={(e) => handleOptionChange(section, option.id, 'description', e.target.value)}
                        placeholder="Enter description"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>

                <FormField>
                  <FormItem>
                    <FormLabel>Price Adjustment ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={option.priceAdjustment}
                        onChange={(e) => handleOptionChange(section, option.id, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                        step="0.01"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>

                <div className="flex space-x-6">
                  <FormField>
                    <FormItem className="flex items-center space-x-2">
                      <FormLabel>Default Option</FormLabel>
                      <FormControl>
                        <Switch
                          checked={option.isDefault}
                          onCheckedChange={(checked) => handleOptionChange(section, option.id, 'isDefault', checked)}
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>

                  <FormField>
                    <FormItem className="flex items-center space-x-2">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={option.isActive}
                          onCheckedChange={(checked) => handleOptionChange(section, option.id, 'isActive', checked)}
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(section, option.id)}
                className="ml-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex space-x-2 border-b">
        {[
          { key: 'mountTypes', label: 'Mount Types' },
          { key: 'controlTypes', label: 'Controls' },
          { key: 'fabricTypes', label: 'Fabrics' },
          { key: 'headrailOptions', label: 'Headrail' },
          { key: 'bottomRailOptions', label: 'Bottom Rail' },
          { key: 'specialtyOptions', label: 'Specialty' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`px-4 py-2 font-medium text-sm ${
              activeSection === key
                ? 'border-b-2 border-primary-red text-primary-red'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {renderOptionsList('mountTypes', 'Mount Types')}
      {renderOptionsList('controlTypes', 'Control Types')}
      {renderOptionsList('fabricTypes', 'Fabric Types')}
      {renderOptionsList('headrailOptions', 'Headrail Options')}
      {renderOptionsList('bottomRailOptions', 'Bottom Rail Options')}
      {renderOptionsList('specialtyOptions', 'Specialty Options')}
    </div>
  );
} 